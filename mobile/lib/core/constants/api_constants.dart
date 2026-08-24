import 'package:flutter/foundation.dart';

class ApiConstants {
  static const _apiBaseFromEnv = String.fromEnvironment('API_BASE_URL');

  /// Your Mac's local network IP so physical devices on the same Wi-Fi can
  /// reach the dev server.  Update this whenever your IP changes.
  static const _localNetworkIp = '192.168.29.141';

  static String get baseUrl {
    if (_apiBaseFromEnv.isNotEmpty) return _apiBaseFromEnv;

    if (kIsWeb) return 'http://localhost:4000';

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        // Physical Android devices need the Mac's LAN IP;
        // 10.0.2.2 only works inside the Android emulator.
        return 'http://$_localNetworkIp:4000';
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
      case TargetPlatform.windows:
      case TargetPlatform.linux:
      case TargetPlatform.fuchsia:
        return 'http://localhost:4000';
    }
  }

  static String get register => '$baseUrl/api/auth/register';
  static String get login => '$baseUrl/api/auth/login';
  static String get phoneLogin => '$baseUrl/api/auth/phone-login';
  static String get logout => '$baseUrl/api/auth/logout';
  static String get refresh => '$baseUrl/api/auth/refresh';
  static String get products => '$baseUrl/api/products';
  static String get categories => '$baseUrl/api/categories';
  static String get cart => '$baseUrl/api/cart';
  static String get orders => '$baseUrl/api/orders';
  static String get paymentIntent => '$baseUrl/api/payments/intent';
  static String get paymentTransaction => '$baseUrl/api/payments/transaction';
  static String get refunds => '$baseUrl/api/refunds';
  static String get reviews => '$baseUrl/api/reviews';
  static String get promotions => '$baseUrl/api/promotions';
  static String get guestSession => '$baseUrl/api/guest/session';
  static String get guestCart => '$baseUrl/api/guest/cart';
  static String get points => '$baseUrl/api/points';
  static String get badges => '$baseUrl/api/badges';
  static String get contact => '$baseUrl/api/contact';
  static String get faq => '$baseUrl/api/faq';
  static String get forgotPassword => '$baseUrl/api/auth/forgot-password';
  static String get resetPassword => '$baseUrl/api/auth/reset-password';
  static String get googleLogin => '$baseUrl/api/auth/google';
  static String get usersMe => '$baseUrl/api/users/me';
  static String get usersMeAddresses => '$baseUrl/api/users/me/addresses';
  static String get usersMeWishlist => '$baseUrl/api/users/me/wishlist';
  static String get usersMeNotificationPreferences => '$baseUrl/api/users/me/notification-preferences';
  static String get usersMePushToken => '$baseUrl/api/users/me/push-token';
}
