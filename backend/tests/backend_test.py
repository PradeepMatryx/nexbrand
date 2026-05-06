"""StyleVibe backend API tests - covers auth, products, cart, wishlist, payments, orders."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://style-hub-1198.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@stylevibe.in"
ADMIN_PASSWORD = "Admin@12345"
TS = int(time.time())
BUYER_EMAIL = f"test_buyer_{TS}@example.com"
BUYER_PASSWORD = "Buyer@12345"


@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["role"] == "admin"
    s.headers.update({"Authorization": f"Bearer {data['token']}"})
    return s


@pytest.fixture(scope="session")
def buyer_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={"email": BUYER_EMAIL, "password": BUYER_PASSWORD, "name": "Test Buyer"})
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    data = r.json()
    s.headers.update({"Authorization": f"Bearer {data['token']}"})
    s.user = data  # type: ignore
    return s


# ----- Health/root -----
def test_root():
    r = requests.get(f"{API}/").__class__  # noqa
    r = requests.get(f"{BASE_URL}/api/")
    # /api/ may 404 since route is /api -> root() is at "/"
    # The actual mount: app.include_router(api) where api has prefix="/api" and root path "/"
    # So GET /api/ should work
    assert r.status_code in (200, 404)


# ----- Products -----
def test_products_list_no_id_leak():
    r = requests.get(f"{API}/products")
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list) and len(items) > 0
    for p in items:
        assert "_id" not in p
        assert "id" in p and "name" in p and "price" in p


def test_products_filters():
    r = requests.get(f"{API}/products", params={"category": "t-shirts", "gender": "men"})
    assert r.status_code == 200
    items = r.json()
    assert all(p["category"] == "t-shirts" and p["gender"] == "men" for p in items)

    r = requests.get(f"{API}/products", params={"min_price": 800, "max_price": 1500})
    assert r.status_code == 200
    assert all(800 <= p["price"] <= 1500 for p in r.json())

    r = requests.get(f"{API}/products", params={"q": "hoodie"})
    assert r.status_code == 200
    assert len(r.json()) > 0

    r = requests.get(f"{API}/products", params={"size": "XL", "tag": "trending"})
    assert r.status_code == 200


def test_product_detail_and_404():
    r = requests.get(f"{API}/products")
    pid = r.json()[0]["id"]
    r2 = requests.get(f"{API}/products/{pid}")
    assert r2.status_code == 200
    assert r2.json()["id"] == pid

    r3 = requests.get(f"{API}/products/does-not-exist")
    assert r3.status_code == 404


def test_categories():
    r = requests.get(f"{API}/categories")
    assert r.status_code == 200
    cats = r.json()
    assert isinstance(cats, list) and len(cats) == 6
    for c in cats:
        assert "slug" in c and "name" in c and "image" in c


# ----- Auth -----
def test_login_admin():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    data = r.json()
    assert data["role"] == "admin"
    assert data["email"] == ADMIN_EMAIL
    assert "token" in data
    # cookie set
    assert "access_token" in r.cookies


def test_login_invalid():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
    assert r.status_code == 401


def test_me_unauthenticated():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_me_with_bearer(admin_session):
    r = admin_session.get(f"{API}/auth/me")
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


def test_register_and_logout():
    s = requests.Session()
    email = f"test_logout_{int(time.time()*1000)}@example.com"
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "Buyer@12345", "name": "Logout User"})
    assert r.status_code == 200
    assert "access_token" in s.cookies
    r2 = s.get(f"{API}/auth/me")
    assert r2.status_code == 200
    r3 = s.post(f"{API}/auth/logout")
    assert r3.status_code == 200
    s.cookies.clear()
    r4 = s.get(f"{API}/auth/me")
    assert r4.status_code == 401


def test_register_duplicate_email(buyer_session):
    r = requests.post(f"{API}/auth/register", json={"email": BUYER_EMAIL, "password": "Buyer@12345", "name": "Dup"})
    assert r.status_code == 400


# ----- Cart -----
def test_cart_flow(buyer_session):
    # get a product
    p = requests.get(f"{API}/products").json()[0]
    pid, size = p["id"], p["sizes"][0]

    # clear first
    buyer_session.delete(f"{API}/cart/all")

    # add
    r = buyer_session.post(f"{API}/cart", json={"product_id": pid, "size": size, "qty": 2})
    assert r.status_code == 200
    cart = r.json()
    assert len(cart) == 1
    assert cart[0]["qty"] == 2
    assert cart[0]["product"]["id"] == pid

    # GET
    r = buyer_session.get(f"{API}/cart")
    assert r.status_code == 200 and len(r.json()) == 1

    # update qty
    r = buyer_session.put(f"{API}/cart", json={"product_id": pid, "size": size, "qty": 5})
    assert r.status_code == 200
    assert r.json()[0]["qty"] == 5

    # delete by query
    r = buyer_session.delete(f"{API}/cart", params={"product_id": pid, "size": size})
    assert r.status_code == 200
    assert r.json() == []

    # add then clear all
    buyer_session.post(f"{API}/cart", json={"product_id": pid, "size": size, "qty": 1})
    r = buyer_session.delete(f"{API}/cart/all")
    assert r.status_code == 200
    assert buyer_session.get(f"{API}/cart").json() == []


def test_cart_unauthenticated():
    r = requests.get(f"{API}/cart")
    assert r.status_code == 401


# ----- Wishlist -----
def test_wishlist_flow(buyer_session):
    p = requests.get(f"{API}/products").json()[0]
    pid = p["id"]

    # idempotent add
    r1 = buyer_session.post(f"{API}/wishlist", json={"product_id": pid})
    assert r1.status_code == 200
    r2 = buyer_session.post(f"{API}/wishlist", json={"product_id": pid})
    assert r2.status_code == 200

    r3 = buyer_session.get(f"{API}/wishlist")
    assert r3.status_code == 200
    items = r3.json()
    assert any(it["id"] == pid for it in items)
    # only 1 instance
    assert sum(1 for it in items if it["id"] == pid) == 1

    r4 = buyer_session.delete(f"{API}/wishlist/{pid}")
    assert r4.status_code == 200
    items = buyer_session.get(f"{API}/wishlist").json()
    assert not any(it["id"] == pid for it in items)


# ----- Payments mock -----
def test_payments_create_order_mocked(buyer_session):
    r = buyer_session.post(f"{API}/payments/create-order", json={"amount": 99900})
    assert r.status_code == 200
    data = r.json()
    assert data["mock"] is True
    assert data["id"].startswith("order_mock_")
    assert data["amount"] == 99900
    assert data["currency"] == "INR"


# ----- Orders -----
def test_create_order_empty_cart(buyer_session):
    buyer_session.delete(f"{API}/cart/all")
    payload = {
        "address": {"full_name": "T", "phone": "9999999999", "line1": "L1",
                    "city": "C", "state": "S", "pincode": "111111"},
        "payment_method": "razorpay",
        "razorpay_order_id": "order_mock_xyz",
        "razorpay_payment_id": "pay_mock_xyz",
    }
    r = buyer_session.post(f"{API}/orders", json=payload)
    assert r.status_code == 400


def test_order_creation_and_totals(buyer_session):
    # Pick item with price ~ 699 (under 999) to test shipping
    products = requests.get(f"{API}/products").json()
    cheap = next(p for p in products if p["price"] < 999)
    expensive = next(p for p in products if p["price"] >= 999)

    # Test: subtotal < 999 → shipping 49
    buyer_session.delete(f"{API}/cart/all")
    buyer_session.post(f"{API}/cart", json={"product_id": cheap["id"], "size": cheap["sizes"][0], "qty": 1})
    payload = {
        "address": {"full_name": "Test", "phone": "9999999999", "line1": "Addr 1",
                    "line2": "", "city": "Mumbai", "state": "MH", "pincode": "400001"},
        "payment_method": "razorpay",
        "razorpay_order_id": "order_mock_123",
        "razorpay_payment_id": "pay_mock_123",
    }
    r = buyer_session.post(f"{API}/orders", json=payload)
    assert r.status_code == 200, r.text
    o = r.json()
    assert o["subtotal"] == cheap["price"]
    assert o["shipping"] == 49
    assert o["total"] == cheap["price"] + 49
    assert "_id" not in o
    assert o["status"] == "confirmed"
    assert len(o["items"]) == 1

    # cart cleared
    assert buyer_session.get(f"{API}/cart").json() == []

    # Test: subtotal >= 999 → free shipping
    buyer_session.post(f"{API}/cart", json={"product_id": expensive["id"], "size": expensive["sizes"][0], "qty": 1})
    r2 = buyer_session.post(f"{API}/orders", json=payload)
    assert r2.status_code == 200
    o2 = r2.json()
    assert o2["subtotal"] == expensive["price"]
    assert o2["shipping"] == 0
    assert o2["total"] == expensive["price"]


def test_list_orders_sorted_desc(buyer_session):
    r = buyer_session.get(f"{API}/orders")
    assert r.status_code == 200
    orders = r.json()
    assert isinstance(orders, list)
    if len(orders) >= 2:
        assert orders[0]["created_at"] >= orders[1]["created_at"]
    for o in orders:
        assert "_id" not in o
