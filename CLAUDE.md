# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JetQueueSystem (JQS) is a MERN stack barbershop queue management app. Customers view and join the queue; the shop owner manages it via an admin panel. The project is split into two independent packages: `server/` (Express/Node.js) and `ui/` (React CRA).

## Commands

### Server (`server/`)
```sh
cd server
npm install
npm run start      # starts with nodemon on PORT from .env (default 3001)
```

### UI (`ui/`)
```sh
cd ui
npm install
npm start          # CRA dev server on port 3000
npm run build      # production build
npm test           # React Testing Library / Jest
```

### First-time setup
Copy and fill in both env files before starting:
```sh
cp server/.env.example server/.env
cp ui/.env.example ui/.env
```
The server auto-creates default MongoDB documents (admin `admin`/`admin` and a shop singleton) on first DB connection via `dbConnection.js` → `createDefaults.js`.

After startup, go to `http://localhost:3000/#/adminLogin`, log in with `admin`/`admin`, and add at least one service via "Hizmet ekle-çıkar" before the app is usable.

## Architecture

### Server

- **Entry point**: `server/app.js` — sets up Express, Socket.IO (`helpers/socketio.js`), CORS, the crypto middleware, web-push VAPID keys, and mounts routes.
- **Routes**:
  - `GET/POST /api/public/*` — unauthenticated, handled by `routes/publicRoute/publicRoute.js`; SMS verification sub-routes at `/api/public/verified/*` in `verifiedRoute.js`
  - `GET/POST/PUT/DELETE /api/admin/*` — protected by `accessMiddleware`, handled by `routes/adminRoute/adminRoute.js`
- **Middleware**:
  - `accessMiddleware` — validates the admin JWT and checks it matches the token stored in the Admin document (enforces single active session)
  - `cryptoMiddleware` — auto-decrypts incoming request bodies when `req.body.type === 'crypted'`
- **Data layer** (`database/schemas/`):
  - `Shop` — singleton (`shopID: 1`); holds `shopStatus`, `orderFeature`, `services[]`, custom opening time, and announcement message
  - `DayBooking` — one per open/close cycle; holds the ordered `usersBooking[]` array of IDs and daily stats
  - `MonthBooking` — groups `DayBooking` IDs and accumulates monthly income/counts
  - `UserBooking` — one record per queue entry; has `bookingToken` (JWT), `serviceID`, `comingWith`, `userID` (optional)
  - `User` — customer records; `userType` is `'verified'` or `'unverified'`
  - `Admin` — single admin document; stores hashed credentials, `adminAccessToken`, and web-push `subscription`
  - Auto-incrementing numeric IDs use `mongoose-sequence` (e.g. `dayBookingID`, `userBookingID`)
- **Crypto**: All sensitive API responses are AES-encrypted with `helpers/cryptoProcess.js` (`encryptData`/`decryptData`) using `ENCRYPTION_DECRYPTION_KEY`. The same key must be in both `.env` files.
- **Real-time**: `helpers/socketio.js` wraps Socket.IO. Call `getIO().emit(event, data)` from any route to push updates; the transport is `websocket` only.
- **JWT tokens** (`helpers/jwtProcesses.js`):
  - Admin token — 1 week, `type: 'admin'`
  - Queue booking token — 1 day, carries `userBookingID` and `dayBookingID`
  - Verified user token — no expiry, carries `userID`, `serviceID`, `comingWith`

### UI

- **Routing**: HashRouter with three routes: `/` → `MainPage`, `/adminLogin` → `AdminEntryPage`, `/admin` → `AdminPage`
- **State management**: Redux Toolkit (`redux/store.js`). Slices are split by page: `mainPageSlices/` (register, dailyBooking, showMessage, verificationUser) and `adminPageSlices/` (adminLogin, adminDailyBooking, fastOps, shopSettings, shopStats, shopStatus, notification)
- **Real-time**: `src/helpers/socketio.js` manages the Socket.IO client connection; components subscribe to events (e.g. `newUser`, `remove`, `finished-cut`, `changedStatus`) to update Redux state
- **Crypto**: `src/helpers/cryptoProcess.js` — same AES logic; used to encrypt outgoing request bodies and decrypt incoming response data
- **UI library**: Material UI v5; charts via Recharts
- **Design system**: A single MUI theme in `src/theme.js` ("Vibrant Grooming": forest-green primary, lime secondary, blue tertiary, Inter font, soft-shadow white cards on a grey surface). It is applied app-wide via `ThemeProvider` + `CssBaseline` in `src/index.js`. Besides the standard MUI `palette`, the theme exposes custom tokens under `theme.jqs.*` (e.g. `surfaceLowest`, `surfaceLow`, `secondaryContainer`, `onSecondaryContainer`, `tertiaryContainer`, `outlineVariant`, `statusSuccess`, `statusWarning`, `cardShadow`) plus keyframe animations (`jqsFadeUp`, `jqsPop`, `jqsPulseGlow`, etc.). Prefer these tokens over hard-coded colors when styling components. Reference mockups for the redesign live in the untracked top-level `main_page/`, `queue/`, and `verify_modal/` folders (each holds `code.html`, `DESIGN.md`, `screen.png`).
- **Env vars**: All prefixed `REACT_APP_`. `REACT_APP_ENCRYPTION_DECRYPTION_KEY` must match `ENCRYPTION_DECRYPTION_KEY` in `server/.env`. VAPID public key must match too.

### Key design patterns

- The `Shop` document is always fetched via `Shop.findOne({shopID:1})` — there is only ever one.
- `DayBooking.usersBooking` is an ordered array of `userBookingID` integers; the queue order is the array order. Up/down moves swap adjacent elements.
- "comingWith" (default 1) means the customer brings additional people; billing for extras uses `shop.services[0]` (the default/cheapest service) as the per-extra-person price.
- Stats (daily, weekly, monthly) are accumulated in-place on `DayBooking` and `MonthBooking` documents when `finish-cut` is called; they are not recomputed from raw records.
- Weekly stats use Turkish weekday names (`weekDays` array in `adminRoute.js`). The app is localised for a Turkish audience.
- `AdminPage` is an app shell: a sticky top `AppBar` (logo, shop name, logout) over a stacked column of section cards — `AdminFirstPart` (shop status + open/close + order-taking toggle + clock), `AdminQueTable`, `FastOperations`, `ShopSettings`, `ShopStats`. The admin logout lives in the AppBar (not in `AdminFirstPart`).
- The order-taking toggle (`changeOrderFeature`) sits next to the open/close button in `AdminFirstPart`; the shop-status card shows a chip ("Sıra alımı açık/durduruldu") so toggling is visible. On the customer main page the announcement message (from `showMessage` slice) renders just below the "Sıra Al" button in `InfoBoxes` — `getMessage` and its socket listeners still live in `BodyInformation`, which is always mounted.
