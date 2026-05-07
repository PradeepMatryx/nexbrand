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
SEED_PRODUCTS = [
    {"name": "Oversized Drop Shoulder Tee - Black", "category": "t-shirts", "gender": "men",
     "price": 699, "original_price": 1299, "sizes": ["S", "M", "L", "XL", "XXL"],
     "image": "https://images.unsplash.com/photo-1654857260001-c4bcddda4942?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxtZW4lMjB0LXNoaXJ0JTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
     "hover_image": "https://images.unsplash.com/photo-1773848091543-c6c7e8ea9781?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHw0fHxtZW4lMjB0LXNoaXJ0JTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
     "description": "Premium heavyweight cotton, oversized relaxed fit with drop shoulder styling. Perfect for streetwear looks.",
     "rating": 4.5, "reviews": 214, "badge": "Bestseller", "tags": ["trending"]},
    {"name": "Essential Cotton Tee - White", "category": "t-shirts", "gender": "men",
     "price": 499, "original_price": 999, "sizes": ["S", "M", "L", "XL"],
     "image": "https://images.unsplash.com/photo-1712917125122-3d5b6527bf47?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwyfHxtZW4lMjB0LXNoaXJ0JTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
     "hover_image": "https://images.unsplash.com/photo-1773848091543-c6c7e8ea9781?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHw0fHxtZW4lMjB0LXNoaXJ0JTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
     "description": "Soft 200 GSM cotton in a clean regular fit. The everyday essential.",
     "rating": 4.3, "reviews": 132, "badge": "", "tags": []},
    {"name": "Classic Brown Pullover Hoodie", "category": "hoodies", "gender": "men",
     "price": 1299, "original_price": 2499, "sizes": ["M", "L", "XL", "XXL"],
     "image": "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwzfHxob29kaWUlMjBwbGFpbiUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc3ODk2NzExfDA&ixlib=rb-4.1.0&q=85",
     "hover_image": "https://images.unsplash.com/photo-1624804859134-c57fd6c5effa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwyfHxob29kaWUlMjBwbGFpbiUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc3ODk2NzExfDA&ixlib=rb-4.1.0&q=85",
     "description": "Brushed fleece interior, ribbed cuffs, kangaroo pocket. Cozy cold-weather favorite.",
     "rating": 4.6, "reviews": 89, "badge": "Hot", "tags": ["trending", "new"]},
    {"name": "Premium Cotton Joggers - Black", "category": "joggers", "gender": "men",
     "price": 799, "original_price": 1499, "sizes": ["S", "M", "L", "XL"],
     "image": "https://images.unsplash.com/photo-1771502244768-a9671a764b2e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxtZW4lMjBqb2dnZXJzJTIwcGxhaW4lMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjcxMXww&ixlib=rb-4.1.0&q=85",
     "hover_image": "https://images.unsplash.com/photo-1771502244768-a9671a764b2e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxtZW4lMjBqb2dnZXJzJTIwcGxhaW4lMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjcxMXww&ixlib=rb-4.1.0&q=85",
     "description": "Tapered slim fit, tri-blend stretch fabric. Elasticated waistband for all-day comfort.",
     "rating": 4.4, "reviews": 176, "badge": "", "tags": ["new"]},
    {"name": "Women Casual White Knit Top", "category": "tops", "gender": "women",
     "price": 899, "original_price": 1599, "sizes": ["XS", "S", "M", "L"],
     "image": "https://images.unsplash.com/photo-1621198059871-0d5f9b449233?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwzfHx3b21lbiUyMGNhc3VhbCUyMHRvcCUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3Nzc4OTY2NzZ8MA&ixlib=rb-4.1.0&q=85",
     "hover_image": "https://images.unsplash.com/photo-1619619742361-b8998a8e2dc0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHw0fHx3b21lbiUyMGNhc3VhbCUyMHRvcCUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3Nzc4OTY2NzZ8MA&ixlib=rb-4.1.0&q=85",
     "description": "Breathable waffle knit in a relaxed silhouette. Pair with denim or tailored trousers.",
     "rating": 4.5, "reviews": 98, "badge": "Bestseller", "tags": ["trending"]},
    {"name": "Women Soft Cotton Tee - Blush", "category": "tops", "gender": "women",
     "price": 649, "original_price": 1199, "sizes": ["XS", "S", "M", "L"],
     "image": "https://images.unsplash.com/photo-1770918655026-c2204eb65ae9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwyfHx3b21lbiUyMGNhc3VhbCUyMHRvcCUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3Nzc4OTY2NzZ8MA&ixlib=rb-4.1.0&q=85",
     "hover_image": "https://images.unsplash.com/photo-1619619742361-b8998a8e2dc0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHw0fHx3b21lbiUyMGNhc3VhbCUyMHRvcCUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3Nzc4OTY2NzZ8MA&ixlib=rb-4.1.0&q=85",
     "description": "Pastel-hued supima cotton tee with a feminine curved hem.",
     "rating": 4.2, "reviews": 54, "badge": "", "tags": ["new"]},
    {"name": "Graphic Print Tee - Retro", "category": "t-shirts", "gender": "men",
     "price": 599, "original_price": 1199, "sizes": ["S", "M", "L", "XL"],
     "image": "https://images.unsplash.com/photo-1773848091543-c6c7e8ea9781?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHw0fHxtZW4lMjB0LXNoaXJ0JTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
     "hover_image": "https://images.unsplash.com/photo-1654857260001-c4bcddda4942?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxtZW4lMjB0LXNoaXJ0JTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
     "description": "Bold retro-inspired graphic print on soft bio-washed cotton.",
     "rating": 4.1, "reviews": 41, "badge": "", "tags": []},
    {"name": "Linen Casual Shirt - Beige", "category": "shirts", "gender": "men",
     "price": 1199, "original_price": 2199, "sizes": ["S", "M", "L", "XL"],
     "image": "https://images.unsplash.com/photo-1697748403348-260ec3169d87?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwzfHxjYXN1YWwlMjBmYXNoaW9uJTIwY291cGxlJTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
     "hover_image": "https://images.unsplash.com/photo-1604942926673-48ee8a893c34?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwyfHxjYXN1YWwlMjBmYXNoaW9uJTIwY291cGxlJTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
     "description": "Breezy linen-blend shirt with a resort-ready drape.",
     "rating": 4.3, "reviews": 67, "badge": "", "tags": []},
    {"name": "Combo: 2 Oversized Tees + 1 Free", "category": "combos", "gender": "men",
     "price": 1399, "original_price": 2997, "sizes": ["S", "M", "L", "XL"],
     "image": "https://images.unsplash.com/photo-1604942926673-48ee8a893c34?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwyfHxjYXN1YWwlMjBmYXNoaW9uJTIwY291cGxlJTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
     "hover_image": "https://images.unsplash.com/photo-1697748403348-260ec3169d87?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwzfHxjYXN1YWwlMjBmYXNoaW9uJTIwY291cGxlJTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
     "description": "Pick any 2 oversized tees, get 1 absolutely free. Choose your sizes at checkout.",
     "rating": 4.7, "reviews": 312, "badge": "Save ₹1598", "tags": ["trending", "combo"]},
    {"name": "Combo: Hoodie + Joggers Set", "category": "combos", "gender": "men",
     "price": 1899, "original_price": 3498, "sizes": ["M", "L", "XL"],
     "image": "https://images.unsplash.com/photo-1624804859134-c57fd6c5effa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwyfHxob29kaWUlMjBwbGFpbiUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc3ODk2NzExfDA&ixlib=rb-4.1.0&q=85",
     "hover_image": "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwzfHxob29kaWUlMjBwbGFpbiUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc3ODk2NzExfDA&ixlib=rb-4.1.0&q=85",
     "description": "Matching co-ord set in heavyweight fleece. Street-ready loungewear.",
     "rating": 4.6, "reviews": 122, "badge": "Save ₹1599", "tags": ["combo", "new"]},
    {"name": "Women Basic Crew Tee - Black", "category": "tops", "gender": "women",
     "price": 549, "original_price": 999, "sizes": ["XS", "S", "M", "L", "XL"],
     "image": "https://images.unsplash.com/photo-1619619742361-b8998a8e2dc0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHw0fHx3b21lbiUyMGNhc3VhbCUyMHRvcCUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3Nzc4OTY2NzZ8MA&ixlib=rb-4.1.0&q=85",
     "hover_image": "https://images.unsplash.com/photo-1621198059871-0d5f9b449233?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwzfHx3b21lbiUyMGNhc3VhbCUyMHRvcCUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3Nzc4OTY2NzZ8MA&ixlib=rb-4.1.0&q=85",
     "description": "Wardrobe staple crew-neck tee in buttery-soft cotton.",
     "rating": 4.4, "reviews": 88, "badge": "", "tags": []},
    {"name": "Women Oversized Hoodie - Sand", "category": "hoodies", "gender": "women",
     "price": 1399, "original_price": 2599, "sizes": ["S", "M", "L"],
     "image": "https://images.unsplash.com/photo-1691132615844-b013a05b51e7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwxfHxob29kaWUlMjBwbGFpbiUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc3ODk2NzExfDA&ixlib=rb-4.1.0&q=85",
     "hover_image": "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwzfHxob29kaWUlMjBwbGFpbiUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc3ODk2NzExfDA&ixlib=rb-4.1.0&q=85",
     "description": "Slouchy oversized fit with a soft brushed-back fleece interior.",
     "rating": 4.5, "reviews": 74, "badge": "New", "tags": ["new"]},
    {"name": "Tapered Cargo Joggers - Olive", "category": "joggers", "gender": "men",
     "price": 999, "original_price": 1899, "sizes": ["S", "M", "L", "XL"],
     "image": "https://images.unsplash.com/photo-1771502244768-a9671a764b2e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxtZW4lMjBqb2dnZXJzJTIwcGxhaW4lMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjcxMXww&ixlib=rb-4.1.0&q=85",
     "hover_image": "https://images.unsplash.com/photo-1771502244768-a9671a764b2e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxtZW4lMjBqb2dnZXJzJTIwcGxhaW4lMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjcxMXww&ixlib=rb-4.1.0&q=85",
     "description": "Utility cargo joggers with side pockets and ribbed hem.",
     "rating": 4.2, "reviews": 39, "badge": "", "tags": []},
    {"name": "Oxford Formal Shirt - White", "category": "shirts", "gender": "men",
     "price": 1099, "original_price": 1999, "sizes": ["S", "M", "L", "XL"],
     "image": "https://images.unsplash.com/photo-1648249664646-c58cd3954f00?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHw0fHxjYXN1YWwlMjBmYXNoaW9uJTIwY291cGxlJTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
     "hover_image": "https://images.unsplash.com/photo-1697748403348-260ec3169d87?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwzfHxjYXN1YWwlMjBmYXNoaW9uJTIwY291cGxlJTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
     "description": "Crisp oxford cotton, tailored fit, mother-of-pearl buttons.",
     "rating": 4.4, "reviews": 61, "badge": "", "tags": []},
    {"name": "Combo: 3 Basic Tees Pack", "category": "combos", "gender": "men",
     "price": 1199, "original_price": 2697, "sizes": ["S", "M", "L", "XL"],
     "image": "https://images.unsplash.com/photo-1712917125122-3d5b6527bf47?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwyfHxtZW4lMjB0LXNoaXJ0JTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
     "hover_image": "https://images.unsplash.com/photo-1654857260001-c4bcddda4942?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxtZW4lMjB0LXNoaXJ0JTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85",
     "description": "Three essential solid tees — white, black, and grey — at a killer bundle price.",
     "rating": 4.6, "reviews": 201, "badge": "Save ₹1498", "tags": ["combo", "trending"]},
    {"name": "Women Jogger Pants - Pink", "category": "joggers", "gender": "women",
     "price": 849, "original_price": 1599, "sizes": ["XS", "S", "M", "L"],
     "image": "https://images.unsplash.com/photo-1770918655026-c2204eb65ae9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwyfHx3b21lbiUyMGNhc3VhbCUyMHRvcCUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3Nzc4OTY2NzZ8MA&ixlib=rb-4.1.0&q=85",
     "hover_image": "https://images.unsplash.com/photo-1619619742361-b8998a8e2dc0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHw0fHx3b21lbiUyMGNhc3VhbCUyMHRvcCUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3Nzc4OTY2NzZ8MA&ixlib=rb-4.1.0&q=85",
     "description": "Soft-touch pastel joggers for everyday comfort.",
     "rating": 4.3, "reviews": 47, "badge": "New", "tags": ["new"]},
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
        {"slug": "t-shirts", "name": "T-Shirts",
         "image": "https://images.unsplash.com/photo-1712917125122-3d5b6527bf47?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwyfHxtZW4lMjB0LXNoaXJ0JTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85"},
        {"slug": "shirts", "name": "Shirts",
         "image": "https://images.unsplash.com/photo-1648249664646-c58cd3954f00?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHw0fHxjYXN1YWwlMjBmYXNoaW9uJTIwY291cGxlJTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85"},
        {"slug": "joggers", "name": "Joggers",
         "image": "https://images.unsplash.com/photo-1771502244768-a9671a764b2e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxtZW4lMjBqb2dnZXJzJTIwcGxhaW4lMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjcxMXww&ixlib=rb-4.1.0&q=85"},
        {"slug": "hoodies", "name": "Hoodies",
         "image": "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwzfHxob29kaWUlMjBwbGFpbiUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc3ODk2NzExfDA&ixlib=rb-4.1.0&q=85"},
        {"slug": "tops", "name": "Women Tops",
         "image": "https://images.unsplash.com/photo-1770918655026-c2204eb65ae9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwyfHx3b21lbiUyMGNhc3VhbCUyMHRvcCUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3Nzc4OTY2NzZ8MA&ixlib=rb-4.1.0&q=85"},
        {"slug": "combos", "name": "Combos",
         "image": "https://images.unsplash.com/photo-1697748403348-260ec3169d87?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwzfHxjYXN1YWwlMjBmYXNoaW9uJTIwY291cGxlJTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3Nzg5NjY3Nnww&ixlib=rb-4.1.0&q=85"},
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
