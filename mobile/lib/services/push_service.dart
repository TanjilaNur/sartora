import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:get/get.dart';
import '../core/constants/api_constants.dart';
import '../firebase_options.dart';
import 'api_service.dart';

/// Same "fail soft, log once" idiom as the backend's pushNotifier.ts and
/// web's pushNotifications.ts — no Firebase project is configured by
/// default (see firebase_options.dart), so this quietly does nothing rather
/// than crashing app startup. Flutter Web is out of scope: the separate
/// React web app (web/) already covers browser push independently.
class PushService extends GetxController {
  final _localNotifications = FlutterLocalNotificationsPlugin();
  String? _currentToken;

  late final Future<void> ready;

  @override
  void onInit() {
    super.onInit();
    ready = _init();
  }

  Future<void> _init() async {
    if (kIsWeb || !DefaultFirebaseOptions.isConfigured) {
      if (kDebugMode && !kIsWeb) {
        // ignore: avoid_print
        print('[push] Firebase not configured — run `flutterfire configure` from mobile/. Skipping.');
      }
      return;
    }

    try {
      await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

      await _localNotifications.initialize(
        const InitializationSettings(
          android: AndroidInitializationSettings('@mipmap/ic_launcher'),
          iOS: DarwinInitializationSettings(),
        ),
      );

      await FirebaseMessaging.instance.requestPermission();

      // iOS shows foreground messages natively once this is set. Android has
      // no equivalent — a foreground message there is handled manually via
      // flutter_local_notifications in _showForegroundNotification below.
      await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      FirebaseMessaging.onMessage.listen(_showForegroundNotification);
      FirebaseMessaging.instance.onTokenRefresh.listen(_registerToken);
    } catch (e) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('[push] Firebase init failed: $e');
      }
    }
  }

  Future<void> _showForegroundNotification(RemoteMessage message) async {
    if (!Platform.isAndroid) return;
    final notification = message.notification;
    if (notification == null) return;
    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'promotions',
          'Promotions & Updates',
          importance: Importance.high,
          priority: Priority.high,
        ),
      ),
    );
  }

  /// Called after login/registration/session-restore succeeds.
  Future<void> registerCurrentToken() async {
    if (kIsWeb || !DefaultFirebaseOptions.isConfigured) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) return;
      await _registerToken(token);
    } catch (e) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('[push] Failed to get/register token: $e');
      }
    }
  }

  Future<void> _registerToken(String token) async {
    _currentToken = token;
    try {
      await ApiService.post(
        ApiConstants.usersMePushToken,
        {'token': token, 'platform': Platform.isIOS ? 'ios' : 'android'},
        withAuth: true,
      );
    } catch (_) {
      // Best-effort — a failed registration just means this device won't get
      // pushes until the next successful login/token-refresh retries it.
    }
  }

  /// Called on logout, before tokens are cleared.
  Future<void> unregisterCurrentToken() async {
    final token = _currentToken;
    if (token == null) return;
    _currentToken = null;
    try {
      await ApiService.delete(ApiConstants.usersMePushToken, body: {'token': token}, withAuth: true);
    } catch (_) {}
  }
}
