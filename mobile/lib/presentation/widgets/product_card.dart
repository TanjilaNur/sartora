import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/auth_controller.dart';
import '../../controllers/profile_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../../data/models/product_model.dart';

class ProductCard extends StatelessWidget {
  final ProductModel product;
  final VoidCallback onTap;

  const ProductCard({super.key, required this.product, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isOutOfStock = product.stock == 0;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: context.surfaceColor,
          borderRadius: BorderRadius.circular(12),
          boxShadow: const [
            BoxShadow(
              color: Color(0x14000000),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    product.primaryImage.isNotEmpty
                        ? Image.network(
                            product.primaryImage,
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => _placeholder(context),
                          )
                        : _placeholder(context),
                    if (isOutOfStock)
                      Container(
                        color: const Color(0x80000000),
                        alignment: Alignment.center,
                        child: const Text(
                          'Out of Stock',
                          style: TextStyle(
                            color: AppColors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'Inter',
                          ),
                        ),
                      ),
                    // Wishlisting requires an account — a guest browsing the
                    // catalog (this same widget is reused on Guest Home)
                    // sees no heart at all rather than one that would 401.
                    if (Get.find<AuthController>().isLoggedIn)
                      Positioned(
                        top: 6,
                        right: 6,
                        child: GestureDetector(
                          onTap: () => Get.find<ProfileController>().toggleWishlist(product),
                          child: Obx(() {
                            final wishlisted = Get.find<ProfileController>().isWishlisted(product.id);
                            return Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(color: Color(0xB3FFFFFF), shape: BoxShape.circle),
                              child: Icon(
                                wishlisted ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                                size: 16,
                                color: wishlisted ? AppColors.danger : AppColors.neutral600,
                              ),
                            );
                          }),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: context.textPrimary,
                      fontFamily: 'Inter',
                    ),
                  ),
                  const SizedBox(height: 2),
                  if (product.categoryName.isNotEmpty)
                    Text(
                      product.categoryName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11,
                        color: context.textSecondary,
                        fontFamily: 'Inter',
                      ),
                    ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '\$${product.price.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                          fontFamily: 'Inter',
                        ),
                      ),
                      if (product.averageRating > 0)
                        Row(
                          children: [
                            const Icon(Icons.star_rounded,
                                size: 13, color: AppColors.secondary),
                            const SizedBox(width: 2),
                            Text(
                              product.averageRating.toStringAsFixed(1),
                              style: TextStyle(
                                fontSize: 11,
                                color: context.textSecondary,
                                fontFamily: 'Inter',
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder(BuildContext context) {
    return Container(
      color: context.primaryTintBackground,
      child: Center(
        child: Icon(Icons.checkroom_rounded,
            color: context.onPrimaryTintBackground, size: 40),
      ),
    );
  }
}
