import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/auth_controller.dart';
import '../../controllers/contact_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});

  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _subjectCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();
  late final ContactController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = Get.find<ContactController>();
    final auth = Get.find<AuthController>();
    final user = auth.user.value;
    if (user != null) {
      _nameCtrl.text = user.name;
      _emailCtrl.text = user.email;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _subjectCtrl.dispose();
    _messageCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final ok = await _ctrl.submitContactForm(
      name: _nameCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      subject: _subjectCtrl.text.trim(),
      message: _messageCtrl.text.trim(),
    );
    if (ok) {
      _subjectCtrl.clear();
      _messageCtrl.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        iconTheme: const IconThemeData(color: AppColors.white),
        title: const Text(
          'Contact Us',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
            fontSize: 20,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _InfoCard(),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: context.surfaceColor,
                borderRadius: BorderRadius.circular(14),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x0A000000),
                    blurRadius: 4,
                    offset: Offset(0, 1),
                  ),
                ],
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Send us a message',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Inter',
                        color: context.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _FormField(
                      controller: _nameCtrl,
                      label: 'Your Name',
                      hint: 'Enter your name',
                      validator: (v) =>
                          (v == null || v.trim().isEmpty) ? 'Name is required' : null,
                    ),
                    const SizedBox(height: 14),
                    _FormField(
                      controller: _emailCtrl,
                      label: 'Email Address',
                      hint: 'Enter your email',
                      keyboardType: TextInputType.emailAddress,
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Email is required';
                        if (!GetUtils.isEmail(v.trim())) return 'Enter a valid email';
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),
                    _FormField(
                      controller: _subjectCtrl,
                      label: 'Subject',
                      hint: 'What is this about?',
                      validator: (v) =>
                          (v == null || v.trim().isEmpty) ? 'Subject is required' : null,
                    ),
                    const SizedBox(height: 14),
                    _FormField(
                      controller: _messageCtrl,
                      label: 'Message',
                      hint: 'Describe your issue or question...',
                      maxLines: 5,
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Message is required';
                        if (v.trim().length < 10) return 'Message too short';
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),
                    Obx(() => SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _ctrl.isSubmitting.value ? null : _submit,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10)),
                              disabledBackgroundColor:
                                  AppColors.primary.withValues(alpha: 0.6),
                            ),
                            child: _ctrl.isSubmitting.value
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2.5, color: AppColors.white),
                                  )
                                : const Text(
                                    'Send Message',
                                    style: TextStyle(
                                      color: AppColors.white,
                                      fontFamily: 'Inter',
                                      fontWeight: FontWeight.w600,
                                      fontSize: 15,
                                    ),
                                  ),
                          ),
                        )),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.primaryTintBackground,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: const Column(
        children: [
          _InfoRow(
            icon: Icons.support_agent_rounded,
            title: 'Customer Support',
            subtitle: 'We typically respond within 24 hours',
          ),
          SizedBox(height: 12),
          _InfoRow(
            icon: Icons.email_outlined,
            title: 'Email Us',
            subtitle: 'support@dressshop.com',
          ),
          SizedBox(height: 12),
          _InfoRow(
            icon: Icons.access_time_rounded,
            title: 'Business Hours',
            subtitle: 'Mon–Fri, 9 AM – 6 PM',
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _InfoRow({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: context.surfaceColor,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 20, color: AppColors.primary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Inter',
                  color: context.textPrimary,
                ),
              ),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 12,
                  color: context.textSecondary,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _FormField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final int maxLines;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;

  const _FormField({
    required this.controller,
    required this.label,
    required this.hint,
    this.maxLines = 1,
    this.keyboardType,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            fontFamily: 'Inter',
            color: context.textPrimary,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          validator: validator,
          style: TextStyle(
            fontSize: 14,
            fontFamily: 'Inter',
            color: context.textPrimary,
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              fontFamily: 'Inter',
              fontSize: 13,
              color: context.textSecondary,
            ),
            filled: true,
            fillColor: context.pageBackground,
            contentPadding: const EdgeInsets.all(14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: context.borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: context.borderColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.danger),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.danger, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
