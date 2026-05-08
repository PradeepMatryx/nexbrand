# Nexbrand Mobile (Expo / React Native)

Native iOS + Android app that consumes the same FastAPI backend used by the web app.

## What's included (v1 scaffold)
- Home (logo header, promo strip, hero card, horizontal categories, featured grid)
- Product list (with size filter, deep links to detail)
- Product detail (image, sizes, description, Add to Cart, Buy Now)
- Cart (qty +/-, remove, totals with free shipping ≥ ₹999)
- Login / Register (Bearer-token auth via AsyncStorage; uses `/api/auth/login` & `/auth/me`)
- Reuses the **same** backend endpoints as the web app (auth via `Authorization: Bearer <jwt>` header)

## Prerequisites
- Node.js 18+
- Yarn or npm
- Expo CLI is bundled — no global install needed
- A device/emulator: install **Expo Go** from App Store/Play Store, OR an Android emulator / iOS simulator

## Setup
```bash
cd mobile
yarn install        # or: npm install
```

## Configure backend URL
Open `app.json` and set `expo.extra.apiUrl` to your backend URL (default points to the preview URL).

For local dev with backend on `localhost:8001`:
- iOS Simulator: `http://localhost:8001`
- Android Emulator: `http://10.0.2.2:8001` (Android maps localhost of the host machine to `10.0.2.2`)
- Real phone over LAN: `http://<your-computer-LAN-IP>:8001` (and start backend with `--host 0.0.0.0`)

You can override at runtime with the `EXPO_PUBLIC_API_URL` env var:
```bash
EXPO_PUBLIC_API_URL="http://192.168.1.42:8001" yarn start
```

## Run

```bash
# Start the Metro bundler
yarn start

# Or directly:
yarn ios       # iOS simulator
yarn android   # Android emulator / connected device
yarn web       # opens in browser (limited; for quick smoke-test only)
```

Then either press `i` / `a` in the terminal, or scan the QR with the **Expo Go** app on your phone.

## Auth note
Mobile apps cannot rely on httpOnly cookies — the app uses **JWT Bearer tokens** stored in `AsyncStorage`. The backend already supports `Authorization: Bearer <token>` as a fallback to cookies, so no backend changes are needed.

## Project structure
```
mobile/
├─ App.js                    # navigation root + providers
├─ app.json                  # Expo config (icons, splash, apiUrl)
├─ babel.config.js
├─ package.json
├─ assets/
│  └─ logo.jpg               # NEX brand logo (icon + splash)
└─ src/
   ├─ api.js                 # axios instance + token helpers
   ├─ config.js              # API_URL, COLORS
   ├─ components/
   │  └─ ProductCard.js
   ├─ context/
   │  ├─ AuthContext.js      # /auth/me on launch, login/register/logout
   │  └─ ShopContext.js      # cart (server when authed, AsyncStorage when guest)
   └─ screens/
      ├─ HomeScreen.js
      ├─ ProductListScreen.js
      ├─ ProductDetailScreen.js
      ├─ CartScreen.js
      └─ LoginScreen.js
```

## Building for stores (later)
- `npx expo prebuild` to generate native iOS/Android projects, then `eas build` for Play Store / App Store, OR
- Use **EAS Build** (Expo's hosted build service) without ever opening Xcode/Android Studio

## Roadmap (next session)
- Wishlist screen
- Address + checkout (Razorpay React Native plugin: `react-native-razorpay`)
- Order history
- Push notifications via Expo Notifications
- Skeleton loaders + image caching
