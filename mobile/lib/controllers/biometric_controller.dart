import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get/get.dart';
import 'package:local_auth/local_auth.dart';

class BiometricController extends GetxController {
  final _auth = LocalAuthentication();
  final _storage = const FlutterSecureStorage();
  static const _enabledKey = 'biometric_lock_enabled';

  final RxBool isEnabled = false.obs;
  final RxBool isAvailable = false.obs;
  // True right after app launch until a successful unlock (or it's
  // determined the lock doesn't apply) — the lock screen watches this.
  final RxBool isLocked = false.obs;

  // _init() reads secure storage asynchronously, so isEnabled isn't
  // reliably set the instant this controller is constructed — anything
  // that needs to make a routing decision based on it (see
  // AuthController._restoreSession) must await this first.
  late final Future<void> ready;

  @override
  void onInit() {
    super.onInit();
    ready = _init();
  }

  Future<void> _init() async {
    try {
      final supported = await _auth.isDeviceSupported();
      final canCheck = await _auth.canCheckBiometrics;
      isAvailable.value = supported && canCheck;
    } catch (_) {
      isAvailable.value = false;
    }

    final saved = await _storage.read(key: _enabledKey);
    isEnabled.value = saved == 'true' && isAvailable.value;
    isLocked.value = isEnabled.value;
  }

  Future<bool> setEnabled(bool value) async {
    if (value) {
      final ok = await authenticate(reason: 'Enable biometric app lock');
      if (!ok) return false;
    }
    isEnabled.value = value;
    await _storage.write(key: _enabledKey, value: value.toString());
    return true;
  }

  Future<bool> authenticate({String reason = 'Unlock Sartora'}) async {
    try {
      final ok = await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(biometricOnly: false, stickyAuth: true),
      );
      if (ok) isLocked.value = false;
      return ok;
    } catch (_) {
      return false;
    }
  }

  void relock() {
    if (isEnabled.value) isLocked.value = true;
  }
}
