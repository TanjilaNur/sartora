import 'package:get/get.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../core/constants/api_constants.dart';
import '../controllers/guest_controller.dart';
import '../controllers/points_controller.dart';
import '../controllers/biometric_controller.dart';
import '../controllers/profile_controller.dart';
import '../data/models/user_model.dart';
import '../services/api_service.dart';
import '../services/push_service.dart';

class _AuthPayload {
  final String token;
  final String refreshToken;
  final UserModel user;

  const _AuthPayload({
    required this.token,
    required this.refreshToken,
    required this.user,
  });
}

class AuthController extends GetxController {
  // Same placeholder-credential convention as this app's Stripe publishable
  // key and the web app's VITE_GOOGLE_CLIENT_ID (see
  // web/src/components/GoogleSignInButton.tsx). Set GOOGLE_CLIENT_ID to your
  // real OAuth client ID before going live.
  //
  // Unlike Stripe (which fails with a normal, catchable error when given a
  // placeholder key), the native iOS Google Sign-In SDK reads its client ID
  // from a `GIDClientID` key in Info.plist / GoogleService-Info.plist, NOT
  // from this Dart-level constructor argument — passing a placeholder string
  // here has no effect on that native check. Neither is present in this
  // project (no real Google Cloud project exists to generate them from), so
  // `GIDSignIn.signInWithOptions:` throws an Objective-C NSException the
  // instant it's invoked — uncatchable from Dart, it aborts the whole
  // process (confirmed via a real crash: GIDSignIn.m:592, SIGABRT). The only
  // reliable fix is to never make that native call while the ID is still
  // this placeholder — see the guard in loginWithGoogle() below.
  static const _googleClientId = String.fromEnvironment('GOOGLE_CLIENT_ID',
      defaultValue: 'replace-with-your-google-client-id.apps.googleusercontent.com');
  static const _googleClientIdConfigured = _googleClientId != 'replace-with-your-google-client-id.apps.googleusercontent.com';

  final Rx<UserModel?> user = Rx<UserModel?>(null);
  final RxBool isLoading = false.obs;
  final RxString errorMessage = ''.obs;
  final RxBool resetEmailSent = false.obs;

  bool get isLoggedIn => user.value != null;

  @override
  void onInit() {
    super.onInit();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final token = await ApiService.getAccessToken();
    if (token != null) {
      Get.find<PointsController>().refreshAll();
      final push = Get.find<PushService>();
      push.ready.then((_) => push.registerCurrentToken());
      final biometric = Get.find<BiometricController>();
      await biometric.ready;
      Get.offAllNamed(biometric.isEnabled.value ? '/lock' : '/home');
      return;
    }
    final storedGuestId = await ApiService.getGuestId();
    if (storedGuestId != null) {
      Get.offAllNamed('/guest-home');
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required String phone,
  }) async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final data = await ApiService.post(ApiConstants.register, {
        'name': name,
        'email': email,
        'password': password,
        'phone': phone,
      });

      final payload = _parseAuthPayload(data);
      await ApiService.saveTokens(payload.token, payload.refreshToken);
      user.value = payload.user;
      await Get.find<GuestController>().mergeCartIntoUser();
      Get.find<PointsController>().refreshAll();
      final push = Get.find<PushService>();
      push.ready.then((_) => push.registerCurrentToken());
      Get.offAllNamed('/home');
    } on ApiException catch (e) {
      errorMessage.value = e.message;
    } catch (e) {
      errorMessage.value = 'Registration failed: ${e.toString()}';
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> phoneLogin({
    required String phone,
    required String password,
  }) async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final data = await ApiService.post(ApiConstants.phoneLogin, {
        'phone': phone,
        'password': password,
      });

      final payload = _parseAuthPayload(data);
      await ApiService.saveTokens(payload.token, payload.refreshToken);
      user.value = payload.user;
      await Get.find<GuestController>().mergeCartIntoUser();
      Get.find<PointsController>().refreshAll();
      final push = Get.find<PushService>();
      push.ready.then((_) => push.registerCurrentToken());
      Get.offAllNamed('/home');
    } on ApiException catch (e) {
      errorMessage.value = e.message;
    } catch (e) {
      errorMessage.value = 'Phone login failed: ${e.toString()}';
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final data = await ApiService.post(ApiConstants.login, {
        'email': email,
        'password': password,
      });

      final payload = _parseAuthPayload(data);
      await ApiService.saveTokens(payload.token, payload.refreshToken);
      user.value = payload.user;
      await Get.find<GuestController>().mergeCartIntoUser();
      Get.find<PointsController>().refreshAll();
      final push = Get.find<PushService>();
      push.ready.then((_) => push.registerCurrentToken());
      Get.offAllNamed('/home');
    } on ApiException catch (e) {
      errorMessage.value = e.message;
    } catch (e) {
      errorMessage.value = 'Login failed: ${e.toString()}';
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> loginWithGoogle() async {
    isLoading.value = true;
    errorMessage.value = '';
    if (!_googleClientIdConfigured) {
      errorMessage.value = 'Google Sign-In is not configured yet — set GOOGLE_CLIENT_ID before going live.';
      isLoading.value = false;
      return;
    }
    try {
      final googleUser = await GoogleSignIn(scopes: ['email'], clientId: _googleClientId).signIn();
      if (googleUser == null) return; // user cancelled the picker

      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;
      if (idToken == null) {
        throw const ApiException(message: 'Google sign-in did not return a token', statusCode: 500);
      }

      final data = await ApiService.post(ApiConstants.googleLogin, {'idToken': idToken});
      final payload = _parseAuthPayload(data);
      await ApiService.saveTokens(payload.token, payload.refreshToken);
      user.value = payload.user;
      await Get.find<GuestController>().mergeCartIntoUser();
      Get.find<PointsController>().refreshAll();
      final push = Get.find<PushService>();
      push.ready.then((_) => push.registerCurrentToken());
      Get.offAllNamed('/home');
    } on ApiException catch (e) {
      errorMessage.value = e.message;
    } catch (e) {
      errorMessage.value = 'Google sign-in failed: ${e.toString()}';
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> requestPasswordReset(String email) async {
    isLoading.value = true;
    errorMessage.value = '';
    resetEmailSent.value = false;
    try {
      await ApiService.post(ApiConstants.forgotPassword, {'email': email});
      resetEmailSent.value = true;
    } on ApiException catch (e) {
      errorMessage.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> logout() async {
    isLoading.value = true;
    try {
      // Must happen before clearTokens() below removes the auth token this
      // needs to identify which token to unregister.
      await Get.find<PushService>().unregisterCurrentToken();
      await ApiService.post(ApiConstants.logout, {}, withAuth: true);
    } catch (_) {
    } finally {
      await ApiService.clearTokens();
      user.value = null;
      Get.find<PointsController>().reset();
      Get.find<ProfileController>().reset();
      isLoading.value = false;
      Get.offAllNamed('/login');
    }
  }

  _AuthPayload _parseAuthPayload(Map<String, dynamic> data) {
    final token = data['token'];
    final refreshToken = data['refreshToken'];
    final userJson = data['user'];

    if (token is! String || token.isEmpty) {
      throw const ApiException(
        message: 'Invalid auth response: missing token',
        statusCode: 500,
      );
    }

    if (refreshToken is! String || refreshToken.isEmpty) {
      throw const ApiException(
        message: 'Invalid auth response: missing refresh token',
        statusCode: 500,
      );
    }

    if (userJson is! Map<String, dynamic>) {
      throw const ApiException(
        message: 'Invalid auth response: missing user',
        statusCode: 500,
      );
    }

    return _AuthPayload(
      token: token,
      refreshToken: refreshToken,
      user: UserModel.fromJson(userJson),
    );
  }
}
