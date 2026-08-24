import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Placeholder — no real Firebase project is wired up yet. Run
/// `flutterfire configure` from the `mobile/` directory (after creating a
/// project at https://console.firebase.google.com) to overwrite this file
/// with real values; it also patches the native Android/iOS build files for
/// you. Until then, [isConfigured] is false and PushService skips Firebase
/// entirely instead of crashing on these placeholder values.
class DefaultFirebaseOptions {
  static const _placeholder = 'REPLACE_WITH_FLUTTERFIRE_CONFIGURE';

  static bool get isConfigured => web.apiKey != _placeholder;

  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: _placeholder,
    appId: _placeholder,
    messagingSenderId: _placeholder,
    projectId: _placeholder,
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: _placeholder,
    appId: _placeholder,
    messagingSenderId: _placeholder,
    projectId: _placeholder,
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: _placeholder,
    appId: _placeholder,
    messagingSenderId: _placeholder,
    projectId: _placeholder,
    iosBundleId: 'com.example.app',
  );
}
