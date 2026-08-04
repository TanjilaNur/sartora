import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../../data/models/order_model.dart';

class PaymentSuccessScreen extends StatelessWidget {
  const PaymentSuccessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final order = Get.arguments as OrderModel?;
    final total = order?.total ?? 0.0;

    return Scaffold(
      backgroundColor: context.pageBackground,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle_rounded,
                  color: AppColors.success,
                  size: 56,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Payment Successful!',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w700,
                  color: context.textPrimary,
                  fontFamily: 'Inter',
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Your payment of \$${total.toStringAsFixed(2)} was processed securely via Stripe.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: context.textSecondary,
                  fontFamily: 'Inter',
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: context.primaryTintBackground,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'Status: Processing',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: context.onPrimaryTintBackground,
                    fontFamily: 'Inter',
                  ),
                ),
              ),
              const SizedBox(height: 32),
              _InfoTile(
                icon: Icons.lock_outline_rounded,
                label: 'PCI-DSS Compliant',
                sublabel: 'Card data handled securely by Stripe',
              ),
              const SizedBox(height: 12),
              _InfoTile(
                icon: Icons.receipt_long_outlined,
                label: 'Receipt',
                sublabel: 'A confirmation will appear in your orders',
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Get.offAllNamed('/home'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text(
                    'Continue Shopping',
                    style: TextStyle(
                      color: AppColors.white,
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sublabel;

  const _InfoTile({
    required this.icon,
    required this.label,
    required this.sublabel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: context.surfaceColor,
        borderRadius: BorderRadius.circular(10),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
            blurRadius: 4,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: context.primaryTintBackground,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: context.onPrimaryTintBackground, size: 20),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: context.textPrimary,
                  fontFamily: 'Inter',
                ),
              ),
              Text(
                sublabel,
                style: TextStyle(
                  fontSize: 12,
                  color: context.textSecondary,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
