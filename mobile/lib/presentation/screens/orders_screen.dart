import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/order_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../../data/models/order_model.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.find<OrderController>();

    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        title: const Text(
          'My Orders',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
            fontSize: 20,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.white),
            tooltip: 'Refresh',
            onPressed: ctrl.fetchOrders,
          ),
        ],
      ),
      body: Obx(() {
        if (ctrl.isLoading.value) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          );
        }
        if (ctrl.errorMessage.value.isNotEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline_rounded,
                      color: AppColors.danger, size: 48),
                  const SizedBox(height: 12),
                  Text(
                    ctrl.errorMessage.value,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: context.textSecondary,
                      fontFamily: 'Inter',
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: ctrl.fetchOrders,
                    style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary),
                    child: const Text('Retry',
                        style: TextStyle(color: AppColors.white)),
                  ),
                ],
              ),
            ),
          );
        }
        if (ctrl.orders.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: context.primaryTintBackground,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Icon(Icons.receipt_long_outlined,
                      color: context.onPrimaryTintBackground, size: 48),
                ),
                const SizedBox(height: 16),
                Text(
                  'No orders yet',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: context.textPrimary,
                    fontFamily: 'Inter',
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Your orders will appear here.',
                  style: TextStyle(
                    fontSize: 14,
                    color: context.textSecondary,
                    fontFamily: 'Inter',
                  ),
                ),
              ],
            ),
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: ctrl.fetchOrders,
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: ctrl.orders.length,
            separatorBuilder: (context, index) => const SizedBox(height: 10),
            itemBuilder: (_, i) => _OrderCard(order: ctrl.orders[i]),
          ),
        );
      }),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final OrderModel order;

  const _OrderCard({required this.order});

  Color _statusColor(String status) {
    switch (status) {
      case 'delivered':
        return AppColors.success;
      case 'cancelled':
        return AppColors.danger;
      case 'shipped':
        return AppColors.primary;
      case 'processing':
        return AppColors.warning;
      default:
        return AppColors.secondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColor(order.status);

    return GestureDetector(
      onTap: () => Get.toNamed('/order-detail', arguments: order),
      child: Container(
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
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Order #${order.orderId.length > 8 ? order.orderId.substring(order.orderId.length - 8).toUpperCase() : order.orderId.toUpperCase()}',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: context.textPrimary,
                      fontFamily: 'Inter',
                    ),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    order.status[0].toUpperCase() + order.status.substring(1),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                      fontFamily: 'Inter',
                    ),
                  ),
                ),
              ],
            ),
            if (order.createdAt != null) ...[
              const SizedBox(height: 4),
              Text(
                _formatDate(order.createdAt!),
                style: TextStyle(
                  fontSize: 12,
                  color: context.textSecondary,
                  fontFamily: 'Inter',
                ),
              ),
            ],
            const SizedBox(height: 10),
            Text(
              '${order.items.length} item${order.items.length == 1 ? '' : 's'}',
              style: TextStyle(
                fontSize: 13,
                color: context.textSecondary,
                fontFamily: 'Inter',
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Text(
                  'Total',
                  style: TextStyle(
                    fontSize: 14,
                    color: context.textSecondary,
                    fontFamily: 'Inter',
                  ),
                ),
                const Spacer(),
                Text(
                  '\$${order.total.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                    fontFamily: 'Inter',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.chevron_right_rounded,
                    color: context.borderColor, size: 18),
                Text(
                  'View Details',
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
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }
}
