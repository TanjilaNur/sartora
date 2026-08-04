import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../../data/models/order_model.dart';

class OrderConfirmationScreen extends StatelessWidget {
  const OrderConfirmationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final order = Get.arguments as OrderModel?;

    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text(
          'Order Confirmed',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
            fontSize: 20,
          ),
        ),
      ),
      body: order == null
          ? const Center(child: Text('No order data'))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check_circle_rounded,
                      color: AppColors.success,
                      size: 48,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Order Placed!',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: context.textPrimary,
                      fontFamily: 'Inter',
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Thank you for your purchase.',
                    style: TextStyle(
                      fontSize: 14,
                      color: context.textSecondary,
                      fontFamily: 'Inter',
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: context.primaryTintBackground,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'Order ID: ${order.orderId}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: context.onPrimaryTintBackground,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  _OrderCard(order: order),
                  const SizedBox(height: 28),
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
    );
  }
}

class _OrderCard extends StatelessWidget {
  final OrderModel order;

  const _OrderCard({required this.order});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.surfaceColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Items',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: context.textPrimary,
              fontFamily: 'Inter',
            ),
          ),
          const SizedBox(height: 10),
          ...order.items.map(
            (item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 5),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '${item.name} × ${item.quantity}',
                      style: TextStyle(
                        fontSize: 13,
                        color: context.textSecondary,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ),
                  Text(
                    '\$${(item.price * item.quantity).toStringAsFixed(2)}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: context.textPrimary,
                      fontFamily: 'Inter',
                    ),
                  ),
                ],
              ),
            ),
          ),
          Divider(color: context.borderColor, height: 24),
          _PriceLine(label: 'Subtotal', amount: order.subtotal),
          if (order.discount > 0) ...[
            const SizedBox(height: 6),
            _PriceLine(
              label: 'Discount',
              amount: -order.discount,
              color: AppColors.success,
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              Text(
                'Total',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: context.textPrimary,
                  fontFamily: 'Inter',
                ),
              ),
              const Spacer(),
              Text(
                '\$${order.total.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.secondary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.info_outline_rounded,
                    size: 14, color: AppColors.secondary),
                const SizedBox(width: 6),
                Text(
                  'Status: ${order.status[0].toUpperCase()}${order.status.substring(1)}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.secondary,
                    fontFamily: 'Inter',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PriceLine extends StatelessWidget {
  final String label;
  final double amount;
  final Color? color;

  const _PriceLine({
    required this.label,
    required this.amount,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final resolvedColor = color ?? context.textSecondary;
    final display =
        amount < 0 ? '-\$${(-amount).toStringAsFixed(2)}' : '\$${amount.toStringAsFixed(2)}';
    return Row(
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: resolvedColor,
            fontFamily: 'Inter',
          ),
        ),
        const Spacer(),
        Text(
          display,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: resolvedColor,
            fontFamily: 'Inter',
          ),
        ),
      ],
    );
  }
}
