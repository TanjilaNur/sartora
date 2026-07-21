# Authentication Setup — Physical Device

This document describes the changes made to enable authentication from a physical Android device to the local backend server.

---

## Problem

The mobile app could not reach the backend at `http://10.0.2.2:4000/api/auth/register` when running on a physical Android device. Three issues were identified:

1. **Dart SDK too old** — Global Dart 3.10.4 didn't satisfy `pubspec.yaml` requirement of `^3.12.0`.
2. **Wrong API base URL** — `10.0.2.2` is an emulator-only alias; physical devices can't use it.
3. **Backend bound to localhost** — The server only accepted connections from `127.0.0.1`.

---

## Fixes

### 1. Pin Flutter SDK via FVM

The global Flutter SDK was outdated. We used [FVM](https://fvm.app) to pin Flutter 3.44.7 (Dart ≥ 3.12) to this project only.

```bash
dart pub global activate fvm
export PATH="$HOME/.pub-cache/bin:$PATH"
fvm install 3.44.7
fvm use 3.44.7 --force
fvm flutter pub get
```

> **Note:** Always use `fvm flutter <command>` instead of plain `flutter` in this project.

---

### 2. Mobile — Use Mac's LAN IP (`lib/core/constants/api_constants.dart`)

Replaced the emulator-only `10.0.2.2` with the Mac's actual local network IP.

```dart
class ApiConstants {
  static const _apiBaseFromEnv = String.fromEnvironment('API_BASE_URL');

  /// Your Mac's local network IP so physical devices on the same Wi-Fi can
  /// reach the dev server. Update this whenever your IP changes.
  static const _localNetworkIp = '192.168.62.77';

  static String get baseUrl {
    if (_apiBaseFromEnv.isNotEmpty) return _apiBaseFromEnv;

    if (kIsWeb) return 'http://localhost:4000';

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://$_localNetworkIp:4000';
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
      case TargetPlatform.windows:
      case TargetPlatform.linux:
      case TargetPlatform.fuchsia:
        return 'http://$_localNetworkIp:4000';
    }
  }
  // ...
}
```

> **Tip:** You can also pass the URL at build time:  
> `fvm flutter run --dart-define=API_BASE_URL=http://<YOUR_IP>:4000`

---

### 3. Backend — Bind to `0.0.0.0` (`src/server.ts`)

Changed the server to listen on all network interfaces so external devices can connect.

```typescript
// Before
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// After
app.listen(Number(PORT), '0.0.0.0', () => console.log(`Server running on 0.0.0.0:${PORT}`));
```

---

### 4. MongoDB — Local Database Setup

The backend requires MongoDB running locally. The connection string is configured in `backend/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/dress-shop
```

**Install MongoDB (if not installed):**

```bash
brew tap mongodb/brew
brew install mongodb-community
```

**Start MongoDB:**

```bash
# Start as a background service
brew services start mongodb-community

# Or run in foreground
mongod --dbpath /usr/local/var/mongodb
```

**Verify MongoDB is running:**

```bash
mongosh --eval "db.runCommand({ ping: 1 })"
```

> **Note:** MongoDB must be running before starting the backend. If the backend logs `Failed to connect to database`, MongoDB is not running.

---

## Prerequisites

- Your **Android phone** and **Mac** must be on the **same Wi-Fi network**.
- The backend server must be running (`npm run dev` from the `backend/` folder).
- MongoDB must be running locally on the Mac.
- No firewall blocking port 4000.

---

## Quick Start

```bash
# Terminal 1 — Start backend
cd backend
npm run dev

# Terminal 2 — Run mobile app
cd mobile
fvm flutter run
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Unable to reach server` | Phone not on same Wi-Fi | Connect to same network |
| `Unable to reach server` | Mac IP changed | Update `_localNetworkIp` in `api_constants.dart` |
| `version solving failed` | Using global `flutter` | Use `fvm flutter pub get` |
| `Failed to connect to database` | MongoDB not running | Start MongoDB: `mongod` |

Find your Mac's current IP:
```bash
ipconfig getifaddr en0
```
