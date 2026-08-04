import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/auth_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';

class PhoneLoginScreen extends StatefulWidget {
  const PhoneLoginScreen({super.key});

  @override
  State<PhoneLoginScreen> createState() => _PhoneLoginScreenState();
}

class _PhoneLoginScreenState extends State<PhoneLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscurePassword = true;

  final AuthController _auth = Get.find();

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    _auth.errorMessage.value = '';
    _auth.phoneLogin(phone: _phoneCtrl.text.trim(), password: _passwordCtrl.text);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.pageBackground,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildHeader(),
                const SizedBox(height: 32),
                _buildCard(),
                const SizedBox(height: 16),
                _buildLinks(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: context.primaryTintBackground,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Icon(Icons.phone_rounded, color: context.onPrimaryTintBackground, size: 40),
        ),
        const SizedBox(height: 16),
        Text(
          'Sartora',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w700,
            color: context.textPrimary,
            fontFamily: 'Inter',
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Sign in with your phone number',
          style: TextStyle(
            fontSize: 14,
            color: context.textSecondary,
            fontFamily: 'Inter',
          ),
        ),
      ],
    );
  }

  Widget _buildCard() {
    return Container(
      decoration: BoxDecoration(
        color: context.surfaceColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 3,
            offset: const Offset(0, 1),
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 2,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildTextField(
              controller: _phoneCtrl,
              label: 'Phone Number',
              hint: '01711111111',
              keyboardType: TextInputType.phone,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Phone number is required';
                if (v.trim().length < 7) return 'Enter a valid phone number';
                return null;
              },
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _passwordCtrl,
              label: 'Password',
              hint: '••••••••',
              obscureText: _obscurePassword,
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: context.textSecondary,
                ),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Password is required';
                return null;
              },
            ),
            const SizedBox(height: 8),
            Obx(() {
              if (_auth.errorMessage.isEmpty) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  _auth.errorMessage.value,
                  style: const TextStyle(
                    color: AppColors.danger,
                    fontSize: 13,
                    fontFamily: 'Inter',
                  ),
                ),
              );
            }),
            const SizedBox(height: 24),
            Obx(() => FilledButton(
              onPressed: _auth.isLoading.value ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: _auth.isLoading.value
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.white,
                      ),
                    )
                  : const Text(
                      'Sign In with Phone',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Inter',
                      ),
                    ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    TextInputType keyboardType = TextInputType.text,
    bool obscureText = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: context.textPrimary,
            fontFamily: 'Inter',
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          validator: validator,
          style: const TextStyle(fontSize: 14, fontFamily: 'Inter'),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: context.borderColor, fontFamily: 'Inter'),
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: context.pageBackground,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: context.borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: context.borderColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.danger),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.danger, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
        ),
      ],
    );
  }

  Widget _buildLinks() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Sign in with email instead? ',
              style: TextStyle(color: context.textSecondary, fontSize: 14, fontFamily: 'Inter'),
            ),
            GestureDetector(
              onTap: () => Get.offNamed('/login'),
              child: const Text(
                'Email Login',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Inter',
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              "Don't have an account? ",
              style: TextStyle(color: context.textSecondary, fontSize: 14, fontFamily: 'Inter'),
            ),
            GestureDetector(
              onTap: () => Get.toNamed('/signup'),
              child: const Text(
                'Sign Up',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Inter',
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
