# StyleVibe — Product Requirements Document

## Original Problem Statement
Modern, mobile-first D2C fashion e-commerce site (Beyoung-style) for India. Sells trendy apparel: t-shirts, joggers, shirts, hoodies, combo packs. Clean minimal UI with white space, accent #FF3F6C, INR pricing, conversion-focused.

## User Choices (locked)
- Auth: JWT email/password (httpOnly cookies, bcrypt)
- Backend: Full MongoDB persistence (products, cart, wishlist, orders)
- Payments: Razorpay (currently MOCKED — keys empty)
- Images: Curated Unsplash stock fashion images (user may share own later)
- Aesthetic: Beyoung-style clean white + #FF3F6C accent

## Architecture
- Backend: FastAPI + Motor (MongoDB) + bcrypt + PyJWT + Razorpay SDK
- Frontend: React 19 (CRA + craco) + TailwindCSS + shadcn/ui + sonner
- Fonts: Outfit (headings) + Poppins (body)
- Routing: react-router-dom v7

## What's Implemented (2026-02-04)
- Auth: register/login/logout/me with httpOnly access_token, bcrypt hashing, admin seed
- Products: 16 seeded items across t-shirts, shirts, joggers, hoodies, tops, combos (men + women) with hover_image, sizes, ratings, badges
- Categories endpoint (6 categories)
- Cart CRUD (server-backed when authed, localStorage when guest, syncs on login)
- Wishlist (toggle, persistent)
- Orders (subtotal/shipping/total, free shipping ≥₹999, clears cart on confirm)
- Razorpay create-order endpoint (mock fallback when keys blank)
- Frontend: Sticky header with mega menu, search autocomplete, slide-out cart drawer, hero slider (auto-advance), category icon grid, featured products, best-seller tabs (Men/Women/Combos), combo deals section, editorial banner, full footer with payment icons
- Product card: hover-swap second image, quick-add with size, wishlist heart, discount badge
- Product detail: image zoom, size selector, Add to Cart + Buy Now, ratings/reviews, related products
- Shop page: filters (category/size/price), URL-driven (gender/tag/q params)
- Checkout: address form, payment method (Razorpay/COD), order summary, mocked Razorpay flow
- All UI elements tagged with kebab-case data-testid

## Personas
- Style-conscious Indian shopper (18-32) browsing on mobile
- Returning buyer redeeming combo offers
- Guest visitor exploring catalog before signing up

## Tested
- Backend: 18/18 pytest cases pass (auth, products, cart, wishlist, payments, orders)
- Frontend: end-to-end Playwright pass (home, search, register, product detail, cart drawer, checkout w/ mocked Razorpay, wishlist, shop filters)

## Backlog (P1)
- Real Razorpay live integration (waiting on user keys)
- Order history page (/orders) — backend endpoint exists, UI page pending
- Product variants (color swatches)
- Coupon codes + discount engine
- Email transactional notifications (Resend or SES)

## Backlog (P2)
- Admin dashboard for product/order management
- Reviews persistence (currently hard-coded examples)
- PWA / install prompt
- SEO product schema / sitemap

## Next Tasks
- Plug in Razorpay test keys when user provides them (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
- Add /orders user-facing page
- Replace stock images with user-uploaded product photos when shared
