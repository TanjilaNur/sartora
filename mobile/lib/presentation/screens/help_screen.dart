import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        iconTheme: const IconThemeData(color: AppColors.white),
        title: const Text(
          'Help & Support',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
            fontSize: 20,
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            _HelpCard(
              icon: Icons.help_outline_rounded,
              title: 'Frequently Asked Questions',
              subtitle: 'Find quick answers to common questions',
              color: AppColors.primary,
              onTap: () => Get.toNamed('/faq'),
            ),
            const SizedBox(height: 16),
            _HelpCard(
              icon: Icons.support_agent_rounded,
              title: 'Contact Us',
              subtitle: 'Send a message to our support team',
              color: AppColors.secondary,
              onTap: () => Get.toNamed('/contact'),
            ),
          ],
        ),
      ),
    );
  }
}

class _HelpCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _HelpCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
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
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, size: 28, color: color),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Inter',
                      color: context.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 13,
                      color: context.textSecondary,
                      fontFamily: 'Inter',
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: context.borderColor),
          ],
        ),
      ),
    );
  }
}
