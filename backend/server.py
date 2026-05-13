from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import bcrypt
import jwt as pyjwt
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

# --- Config ---
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@nexbrand.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@12345")
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
# "local" (http, no secure) or "prod" (https, cross-site cookies)
COOKIE_MODE = os.environ.get("COOKIE_MODE", "prod").lower()

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Nexbrand API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nexbrand")


# ---------- Helpers ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------- Models ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=80)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str


class CartItemIn(BaseModel):
    product_id: str
    size: str
    qty: int = 1


class WishlistIn(BaseModel):
    product_id: str


class AddressIn(BaseModel):
    full_name: str
    phone: str
    line1: str
    line2: Optional[str] = ""
    city: str
    state: str
    pincode: str


class OrderIn(BaseModel):
    address: AddressIn
    payment_method: str = "cod"  # cod | razorpay
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None


class RazorpayOrderIn(BaseModel):
    amount: int  # paise


# ---------- Seed products ----------
# Brand asset URLs (Emergent customer-assets CDN, served publicly)
_NEX_POLO_BLACK_1 = "https://customer-assets.emergentagent.com/job_style-hub-1198/artifacts/g3qw4byk_nex_polo_1.png"
_NEX_POLO_WHITE = "https://customer-assets.emergentagent.com/job_style-hub-1198/artifacts/bd9w0upg_nex_polo_2.png"
_NEX_POLO_BLACK_2 = "https://customer-assets.emergentagent.com/job_style-hub-1198/artifacts/p0p9n87o_nex_polo_3.png"
_NEX_POLO_NAVY = "https://customer-assets.emergentagent.com/job_style-hub-1198/artifacts/q4frv856_nex_polo_7.png"
_NEX_POLO_CREAM = "https://customer-assets.emergentagent.com/job_style-hub-1198/artifacts/q307cmrk_nex_polo_8.png"
_NEX_BLUE_FLAT = "https://customer-assets.emergentagent.com/job_style-hub-1198/artifacts/kjn5fy2u_Bluecolor.jpg"
_NEX_NAVY_FLAT = "https://customer-assets.emergentagent.com/job_style-hub-1198/artifacts/7u616d6f_navybluecolor.png"
_NEX_CATALOG_1 = "https://customer-assets.emergentagent.com/job_style-hub-1198/artifacts/5k7ba6th_nex_catalog_1.png"
_NEX_CATALOG_2 = "https://customer-assets.emergentagent.com/job_style-hub-1198/artifacts/mf3t5fct_nex_catalog_2.png"
# Women collection
_NEX_WOMEN_COLLAGE = "https://customer-assets.emergentagent.com/job_style-hub-1198/artifacts/fvibz85c_female_nex_1.png"
_NEX_WOMEN_BLACK = "https://customer-assets.emergentagent.com/job_style-hub-1198/artifacts/ioortk1f_female_nex_2.png"
_NEX_WOMEN_WHITE = "https://customer-assets.emergentagent.com/job_style-hub-1198/artifacts/gcvamf4l_female_nex_3.png"
_NEX_WOMEN_NAVY = "https://customer-assets.emergentagent.com/job_style-hub-1198/artifacts/ka04hqql_female_nex_4.png"
_NEX_WOMEN_GREY = "https://customer-assets.emergentagent.com/job_style-hub-1198/artifacts/k6onl4q1_female_nex_5.png"
# Mixed-gender banner (used for combo packs)
_NEX_CORPORATE_BANNER = "https://customer-assets.emergentagent.com/job_style-hub-1198/artifacts/vh8i1jih_Corportae_orders.png"

_POLO_SIZES = ["S", "M", "L", "XL", "XXL"]
_POLO_DESC = (
    "Premium pique-knit polo with the embroidered NEX chest logo. "
    "Soft cotton-blend fabric, breathable structure, reinforced placket and tipped collar. "
    "Tailored regular fit — pairs with denim, chinos or shorts."
)

SEED_PRODUCTS = [
    {"name": "NEX Signature Polo — Jet Black", "category": "polos", "gender": "men",
     "price": 899, "original_price": 1499, "sizes": _POLO_SIZES,
     "image": _NEX_POLO_BLACK_1, "hover_image": _NEX_POLO_BLACK_2,
     "description": _POLO_DESC,
     "rating": 4.7, "reviews": 312, "badge": "Bestseller", "tags": ["trending", "polo"]},
    {"name": "NEX Classic Polo — Pure White", "category": "polos", "gender": "men",
     "price": 899, "original_price": 1499, "sizes": _POLO_SIZES,
     "image": _NEX_POLO_WHITE, "hover_image": _NEX_CATALOG_1,
     "description": _POLO_DESC,
     "rating": 4.6, "reviews": 248, "badge": "Bestseller", "tags": ["trending", "polo"]},
    {"name": "NEX Sport Polo — Navy Blue", "category": "polos", "gender": "men",
     "price": 899, "original_price": 1499, "sizes": _POLO_SIZES,
     "image": _NEX_POLO_NAVY, "hover_image": _NEX_NAVY_FLAT,
     "description": _POLO_DESC,
     "rating": 4.5, "reviews": 187, "badge": "New", "tags": ["new", "polo"]},
    {"name": "NEX Premium Polo — Royal Blue", "category": "polos", "gender": "men",
     "price": 899, "original_price": 1499, "sizes": _POLO_SIZES,
     "image": _NEX_BLUE_FLAT, "hover_image": _NEX_CATALOG_2,
     "description": _POLO_DESC,
     "rating": 4.4, "reviews": 96, "badge": "", "tags": ["new", "polo"]},
    {"name": "NEX Heritage Polo — Sandstone Cream", "category": "polos", "gender": "men",
     "price": 899, "original_price": 1499, "sizes": _POLO_SIZES,
     "image": _NEX_POLO_CREAM, "hover_image": _NEX_CATALOG_1,
     "description": _POLO_DESC,
     "rating": 4.5, "reviews": 142, "badge": "", "tags": ["polo"]},
    {"name": "NEX Everyday Polo — Heather Grey", "category": "polos", "gender": "men",
     "price": 899, "original_price": 1499, "sizes": _POLO_SIZES,
     "image": _NEX_CATALOG_2, "hover_image": _NEX_CATALOG_1,
     "description": _POLO_DESC,
     "rating": 4.4, "reviews": 118, "badge": "", "tags": ["polo"]},
    {"name": "NEX 4-Polo His & Hers Starter Pack", "category": "combos", "gender": "unisex",
     "price": 2999, "original_price": 5996, "sizes": _POLO_SIZES,
     "image": _NEX_CORPORATE_BANNER, "hover_image": _NEX_WOMEN_COLLAGE,
     "description": "Mix and match any 4 NEX polos across men's and women's fits. Built for couples, teams or pairing up his & her workwear.",
     "rating": 4.8, "reviews": 421, "badge": "Save ₹2997", "tags": ["trending", "combo"]},
    {"name": "NEX 8-Color Master Bundle — His & Hers", "category": "combos", "gender": "unisex",
     "price": 5499, "original_price": 11992, "sizes": _POLO_SIZES,
     "image": _NEX_WOMEN_COLLAGE, "hover_image": _NEX_CATALOG_1,
     "description": "Every NEX polo color across men's and women's fits — Black, White, Navy, Royal Blue, Cream, Grey, Olive and Beige. The full wardrobe drop for couples and teams.",
     "rating": 4.9, "reviews": 287, "badge": "Save ₹6493", "tags": ["trending", "combo"]},
    # ----- Women's Collection -----
    {"name": "NEX Women's Signature Polo — Jet Black", "category": "polos", "gender": "women",
     "price": 899, "original_price": 1499, "sizes": ["XS", "S", "M", "L", "XL"],
     "image": _NEX_WOMEN_BLACK, "hover_image": _NEX_WOMEN_COLLAGE,
     "description": _POLO_DESC + " Tailored for a flattering feminine silhouette.",
     "rating": 4.7, "reviews": 156, "badge": "Bestseller", "tags": ["trending", "polo", "women"]},
    {"name": "NEX Women's Classic Polo — Pure White", "category": "polos", "gender": "women",
     "price": 899, "original_price": 1499, "sizes": ["XS", "S", "M", "L", "XL"],
     "image": _NEX_WOMEN_WHITE, "hover_image": _NEX_WOMEN_COLLAGE,
     "description": _POLO_DESC + " Tailored for a flattering feminine silhouette.",
     "rating": 4.6, "reviews": 134, "badge": "New", "tags": ["new", "polo", "women"]},
    {"name": "NEX Women's Sport Polo — Navy Blue", "category": "polos", "gender": "women",
     "price": 899, "original_price": 1499, "sizes": ["XS", "S", "M", "L", "XL"],
     "image": _NEX_WOMEN_NAVY, "hover_image": _NEX_WOMEN_COLLAGE,
     "description": _POLO_DESC + " Tailored for a flattering feminine silhouette.",
     "rating": 4.5, "reviews": 98, "badge": "New", "tags": ["new", "polo", "women"]},
    {"name": "NEX Women's Everyday Polo — Heather Grey", "category": "polos", "gender": "women",
     "price": 899, "original_price": 1499, "sizes": ["XS", "S", "M", "L", "XL"],
     "image": _NEX_WOMEN_GREY, "hover_image": _NEX_WOMEN_COLLAGE,
     "description": _POLO_DESC + " Tailored for a flattering feminine silhouette.",
     "rating": 4.4, "reviews": 87, "badge": "", "tags": ["polo", "women"]},
]


# ---------- Startup ----------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.products.create_index("category")
    await db.cart.create_index([("user_id", 1), ("product_id", 1), ("size", 1)], unique=True)
    await db.wishlist.create_index([("user_id", 1), ("product_id", 1)], unique=True)

    # Seed admin
    existing_admin = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing_admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "name": "Admin",
            "role": "admin",
            "password_hash": hash_password(ADMIN_PASSWORD),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded admin user")

    # Seed products if empty
    count = await db.products.count_documents({})
    if count == 0:
        docs = []
        for p in SEED_PRODUCTS:
            docs.append({**p, "id": str(uuid.uuid4()),
                         "created_at": datetime.now(timezone.utc).isoformat()})
        await db.products.insert_many(docs)
        logger.info(f"Seeded {len(docs)} products")


# ---------- Auth routes ----------
def set_auth_cookie(response: Response, token: str):
    if COOKIE_MODE == "local":
        # http://localhost — browsers reject Secure/SameSite=None without https
        response.set_cookie(
            key="access_token", value=token, httponly=True,
            secure=False, samesite="lax", max_age=60 * 60 * 24 * 7, path="/",
        )
    else:
        response.set_cookie(
            key="access_token", value=token, httponly=True,
            secure=True, samesite="none", max_age=60 * 60 * 24 * 7, path="/",
        )


def clear_auth_cookie(response: Response):
    response.delete_cookie("access_token", path="/")


@api.post("/auth/register")
async def register(data: RegisterIn, response: Response):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id, "email": email, "name": data.name, "role": "user",
        "password_hash": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    token = create_access_token(user_id, email)
    set_auth_cookie(response, token)
    return {"id": user_id, "email": email, "name": data.name, "role": "user", "token": token}


@api.post("/auth/login")
async def login(data: LoginIn, response: Response):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email)
    set_auth_cookie(response, token)
    return {"id": user["id"], "email": user["email"], "name": user["name"],
            "role": user.get("role", "user"), "token": token}


@api.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "name": user["name"],
            "role": user.get("role", "user")}


# ---------- Products ----------
@api.get("/products")
async def list_products(
    category: Optional[str] = None,
    gender: Optional[str] = None,
    size: Optional[str] = None,
    tag: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    q: Optional[str] = None,
    limit: int = Query(60, le=120),
):
    query = {}
    if category and category != "all":
        query["category"] = category
    if gender and gender != "all":
        query["gender"] = gender
    if size:
        query["sizes"] = size
    if tag:
        query["tags"] = tag
    if min_price is not None or max_price is not None:
        price_q = {}
        if min_price is not None:
            price_q["$gte"] = min_price
        if max_price is not None:
            price_q["$lte"] = max_price
        query["price"] = price_q
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"category": {"$regex": q, "$options": "i"}},
        ]
    items = await db.products.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return items


@api.get("/products/{product_id}")
async def get_product(product_id: str):
    p = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@api.get("/categories")
async def categories():
    return [
        {"slug": "polos", "name": "All Polos", "to": "/category/polos",
         "image": _NEX_POLO_BLACK_1},
        {"slug": "men", "name": "Men", "to": "/shop?gender=men",
         "image": _NEX_POLO_BLACK_2},
        {"slug": "women", "name": "Women", "to": "/shop?gender=women",
         "image": _NEX_WOMEN_BLACK},
        {"slug": "black", "name": "Black", "to": "/shop?q=Black",
         "image": _NEX_POLO_BLACK_1},
        {"slug": "white", "name": "White", "to": "/shop?q=White",
         "image": _NEX_POLO_WHITE},
        {"slug": "navy", "name": "Navy", "to": "/shop?q=Navy",
         "image": _NEX_POLO_NAVY},
    ]


# ---------- Cart ----------
async def _cart_with_products(user_id: str):
    items = await db.cart.find({"user_id": user_id}, {"_id": 0}).to_list(200)
    ids = [i["product_id"] for i in items]
    products = await db.products.find({"id": {"$in": ids}}, {"_id": 0}).to_list(200)
    pmap = {p["id"]: p for p in products}
    out = []
    for i in items:
        p = pmap.get(i["product_id"])
        if not p:
            continue
        out.append({**i, "product": p})
    return out


@api.get("/cart")
async def get_cart(user: dict = Depends(get_current_user)):
    return await _cart_with_products(user["id"])


@api.post("/cart")
async def add_to_cart(data: CartItemIn, user: dict = Depends(get_current_user)):
    existing = await db.cart.find_one({"user_id": user["id"], "product_id": data.product_id, "size": data.size})
    if existing:
        await db.cart.update_one(
            {"user_id": user["id"], "product_id": data.product_id, "size": data.size},
            {"$inc": {"qty": data.qty}},
        )
    else:
        await db.cart.insert_one({
            "id": str(uuid.uuid4()), "user_id": user["id"],
            "product_id": data.product_id, "size": data.size, "qty": data.qty,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return await _cart_with_products(user["id"])


@api.put("/cart")
async def update_cart(data: CartItemIn, user: dict = Depends(get_current_user)):
    if data.qty <= 0:
        await db.cart.delete_one({"user_id": user["id"], "product_id": data.product_id, "size": data.size})
    else:
        await db.cart.update_one(
            {"user_id": user["id"], "product_id": data.product_id, "size": data.size},
            {"$set": {"qty": data.qty}},
        )
    return await _cart_with_products(user["id"])


@api.delete("/cart")
async def remove_from_cart(product_id: str, size: str, user: dict = Depends(get_current_user)):
    await db.cart.delete_one({"user_id": user["id"], "product_id": product_id, "size": size})
    return await _cart_with_products(user["id"])


@api.delete("/cart/all")
async def clear_cart(user: dict = Depends(get_current_user)):
    await db.cart.delete_many({"user_id": user["id"]})
    return []


# ---------- Wishlist ----------
@api.get("/wishlist")
async def get_wishlist(user: dict = Depends(get_current_user)):
    items = await db.wishlist.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    ids = [i["product_id"] for i in items]
    products = await db.products.find({"id": {"$in": ids}}, {"_id": 0}).to_list(200)
    return products


@api.post("/wishlist")
async def add_wishlist(data: WishlistIn, user: dict = Depends(get_current_user)):
    try:
        await db.wishlist.insert_one({
            "id": str(uuid.uuid4()), "user_id": user["id"],
            "product_id": data.product_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception:
        pass
    return {"ok": True}


@api.delete("/wishlist/{product_id}")
async def remove_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    await db.wishlist.delete_one({"user_id": user["id"], "product_id": product_id})
    return {"ok": True}


# ---------- Payments (Razorpay) ----------
@api.post("/payments/create-order")
async def create_razorpay_order(data: RazorpayOrderIn, user: dict = Depends(get_current_user)):
    # MOCKED when keys missing — returns a fake order so UI flow completes end-to-end
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        return {
            "id": f"order_mock_{uuid.uuid4().hex[:16]}",
            "amount": data.amount,
            "currency": "INR",
            "key_id": "",
            "mock": True,
        }
    import razorpay
    rzp = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    order = rzp.order.create({"amount": data.amount, "currency": "INR", "payment_capture": 1})
    return {**order, "key_id": RAZORPAY_KEY_ID, "mock": False}


# ---------- Orders ----------
@api.post("/orders")
async def create_order(data: OrderIn, user: dict = Depends(get_current_user)):
    cart = await _cart_with_products(user["id"])
    if not cart:
        raise HTTPException(status_code=400, detail="Cart is empty")
    subtotal = sum(item["product"]["price"] * item["qty"] for item in cart)
    shipping = 0 if subtotal >= 999 else 49
    total = subtotal + shipping

    order = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "items": [{"product_id": i["product_id"], "name": i["product"]["name"],
                   "price": i["product"]["price"], "size": i["size"], "qty": i["qty"],
                   "image": i["product"]["image"]} for i in cart],
        "address": data.address.model_dump(),
        "payment_method": data.payment_method,
        "razorpay_order_id": data.razorpay_order_id,
        "razorpay_payment_id": data.razorpay_payment_id,
        "subtotal": subtotal, "shipping": shipping, "total": total,
        "status": "confirmed",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(order)
    await db.cart.delete_many({"user_id": user["id"]})
    order.pop("_id", None)
    return order


@api.get("/orders")
async def list_orders(user: dict = Depends(get_current_user)):
    items = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items


@api.get("/")
async def root():
    return {"ok": True, "service": "Nexbrand API"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()
