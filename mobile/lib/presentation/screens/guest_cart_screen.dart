import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/guest_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';

class GuestCartScreen extends StatelessWidget {
  const GuestCartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final guest = Get.find<GuestController>();

    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        iconTheme: const IconThemeData(color: AppColors.white),
        title: const Text(
          'Guest Cart',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
            fontSize: 20,
          ),
        ),
      ),
      body: Obx(() {
        if (guest.isLoading.value) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          );
        }

        if (guest.cartItems.isEmpty) {
          return _buildEmptyState(context);
        }

        return Column(
          children: [
            Expanded(child: _buildItemList(guest)),
            _buildSummary(context, guest),
          ],
        );
      }),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shopping_cart_outlined,
              size: 72, color: context.borderColor),
          const SizedBox(height: 16),
          Text(
            'Your guest cart is empty',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: context.textPrimary,
              fontFamily: 'Inter',
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Browse the catalog and add items.',
            style: TextStyle(
              fontSize: 14,
              color: context.textSecondary,
              fontFamily: 'Inter',
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Get.back(),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text(
              'Browse Products',
              style: TextStyle(
                  color: AppColors.white,
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemList(GuestController guest) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: guest.cartItems.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = guest.cartItems[index];
        return _GuestCartItemCard(item: item, guest: guest);
      },
    );
  }

  Widget _buildSummary(BuildContext context, GuestController guest) {
    return Container(
      decoration: BoxDecoration(
        color: context.surfaceColor,
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 8,
            offset: Offset(0, -2),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: context.textPrimary,
                  fontFamily: 'Inter',
                ),
              ),
              Obx(() => Text(
                    '\$${guest.cartTotal.value.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                      fontFamily: 'Inter',
                    ),
                  )),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () => _showSignInPrompt(context),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text(
                'Sign In to Checkout',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Inter',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showSignInPrompt(BuildContext context) {
    Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Sign In Required',
          style: TextStyle(
            fontFamily: 'Inter',
            fontWeight: FontWeight.w700,
            fontSize: 18,
            color: context.textPrimary,
          ),
        ),
        content: Text(
          'Create an account or sign in to complete your purchase. Your cart items will be saved.',
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: 14,
            color: context.textSecondary,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: Text(
              'Cancel',
              style: TextStyle(
                  color: context.textSecondary, fontFamily: 'Inter'),
            ),
          ),
          FilledButton(
            onPressed: () {
              Get.back();
              Get.offAllNamed('/login');
            },
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text(
              'Sign In',
              style:
                  TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _GuestCartItemCard extends StatelessWidget {
  final GuestCartItem item;
  final GuestController guest;

  const _GuestCartItemCard({required this.item, required this.guest});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.surfaceColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 3,
            offset: Offset(0, 1),
          ),
        ],
      ),
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          _buildImage(context),
          const SizedBox(width: 12),
          Expanded(child: _buildInfo(context)),
          _buildQtyControls(context),
        ],
      ),
    );
  }

  Widget _buildImage(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: item.imageUrl != null && item.imageUrl!.isNotEmpty
          ? Image.network(
              item.imageUrl!,
              width: 72,
              height: 72,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => _placeholder(context),
            )
          : _placeholder(context),
    );
  }

  Widget _placeholder(BuildContext context) {
    return Container(
      width: 72,
      height: 72,
      color: context.pageBackground,
      child: Icon(Icons.checkroom_rounded,
          color: context.borderColor, size: 32),
    );
  }

  Widget _buildInfo(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          item.name,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: context.textPrimary,
            fontFamily: 'Inter',
          ),
        ),
        if (item.variant != null &&
            (item.variant!.label.isNotEmpty ||
                item.variant!.swatchColor != null)) ...[
          const SizedBox(height: 2),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (item.variant!.swatchColor != null) ...[
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: item.variant!.swatchColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: context.borderColor),
                  ),
                ),
                const SizedBox(width: 4),
              ],
              if (item.variant!.label.isNotEmpty)
                Text(
                  item.variant!.label,
                  style: TextStyle(
                    fontSize: 12,
                    color: context.textSecondary,
                    fontFamily: 'Inter',
                  ),
                ),
            ],
          ),
        ],
        const SizedBox(height: 4),
        Text(
          '\$${item.price.toStringAsFixed(2)}',
          style: TextStyle(
            fontSize: 13,
            color: context.textSecondary,
            fontFamily: 'Inter',
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Subtotal: \$${item.subtotal.toStringAsFixed(2)}',
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.primary,
            fontFamily: 'Inter',
          ),
        ),
      ],
    );
  }

  Widget _buildQtyControls(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _qtyButton(
              context: context,
              icon: Icons.remove,
              onTap: () => guest.updateGuestCartItem(
                  item.productId, item.quantity - 1,
                  variantId: item.variant?.id),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Text(
                '${item.quantity}',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Inter',
                  color: context.textPrimary,
                ),
              ),
            ),
            _qtyButton(
              context: context,
              icon: Icons.add,
              onTap: () => guest.updateGuestCartItem(
                  item.productId, item.quantity + 1,
                  variantId: item.variant?.id),
            ),
          ],
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () => guest.removeFromGuestCart(item.productId,
              variantId: item.variant?.id),
          child: const Text(
            'Remove',
            style: TextStyle(
              fontSize: 12,
              color: AppColors.danger,
              fontFamily: 'Inter',
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  Widget _qtyButton({
    required BuildContext context,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          border: Border.all(color: context.borderColor),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Icon(icon, size: 16, color: context.textPrimary),
      ),
    );
  }
}
