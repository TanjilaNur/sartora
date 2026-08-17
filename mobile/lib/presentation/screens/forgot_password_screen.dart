import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/auth_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _auth = Get.find<AuthController>();

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    _auth.requestPasswordReset(_emailCtrl.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        iconTheme: const IconThemeData(color: AppColors.white),
        title: const Text('Reset Password',
            style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w700, fontFamily: 'Inter', fontSize: 20)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Obx(() {
          if (_auth.resetEmailSent.value) {
            return Column(
              children: [
                const SizedBox(height: 32),
                const Icon(Icons.mark_email_read_rounded, color: AppColors.success, size: 56),
                const SizedBox(height: 20),
                Text('Check your email',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, fontFamily: 'Inter', color: context.textPrimary)),
                const SizedBox(height: 8),
                Text(
                  'If an account exists for ${_emailCtrl.text.trim()}, we\'ve sent a link to reset your password. Open it on any device to finish resetting.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, fontFamily: 'Inter', color: context.textSecondary),
                ),
                const SizedBox(height: 24),
                TextButton(onPressed: () => Get.back(), child: const Text('Back to Sign In')),
              ],
            );
          }
          return Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  "Enter the email on your account and we'll send you a link to reset your password.",
                  style: TextStyle(fontSize: 14, fontFamily: 'Inter', color: context.textSecondary),
                ),
                const SizedBox(height: 20),
                Text('Email', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, fontFamily: 'Inter', color: context.textPrimary)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Email is required';
                    if (!GetUtils.isEmail(v.trim())) return 'Enter a valid email';
                    return null;
                  },
                  decoration: InputDecoration(
                    hintText: 'you@example.com',
                    filled: true,
                    fillColor: context.surfaceColor,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: context.borderColor)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: context.borderColor)),
                    focusedBorder:
                        OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  ),
                ),
                if (_auth.errorMessage.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(_auth.errorMessage.value, style: const TextStyle(color: AppColors.danger, fontSize: 13, fontFamily: 'Inter')),
                  ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _auth.isLoading.value ? null : _submit,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: _auth.isLoading.value
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.white))
                      : const Text('Send Reset Link', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, fontFamily: 'Inter')),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}
