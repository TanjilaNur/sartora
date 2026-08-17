import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/biometric_controller.dart';
import '../../core/constants/app_colors.dart';

/// Shown at launch when biometric app-lock is enabled and a session already
/// exists — gates entry to /home behind Face ID / Touch ID / fingerprint
/// rather than adding a new login method (the existing session is reused
/// once unlocked).
class LockScreen extends StatefulWidget {
  const LockScreen({super.key});

  @override
  State<LockScreen> createState() => _LockScreenState();
}

class _LockScreenState extends State<LockScreen> {
  final _biometric = Get.find<BiometricController>();
  bool _authenticating = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _attempt());
  }

  Future<void> _attempt() async {
    setState(() => _authenticating = true);
    final ok = await _biometric.authenticate();
    if (!mounted) return;
    setState(() => _authenticating = false);
    if (ok) Get.offAllNamed('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock_rounded, color: Colors.white, size: 64),
                const SizedBox(height: 24),
                const Text(
                  'Sartora is locked',
                  style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700, fontFamily: 'Inter'),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Unlock with Face ID / Touch ID / fingerprint to continue',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white70, fontSize: 14, fontFamily: 'Inter'),
                ),
                const SizedBox(height: 32),
                if (_authenticating)
                  const CircularProgressIndicator(color: Colors.white)
                else
                  ElevatedButton.icon(
                    onPressed: _attempt,
                    icon: const Icon(Icons.fingerprint_rounded),
                    label: const Text('Unlock'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
