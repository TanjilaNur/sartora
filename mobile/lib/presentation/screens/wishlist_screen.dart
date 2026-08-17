import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/profile_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../widgets/product_card.dart';

class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});

  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  late final ProfileController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = Get.find<ProfileController>();
    _ctrl.loadWishlist();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        iconTheme: const IconThemeData(color: AppColors.white),
        title: const Text('My Wishlist',
            style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w700, fontFamily: 'Inter', fontSize: 20)),
      ),
      body: Obx(() {
        if (_ctrl.isLoading.value && _ctrl.wishlist.isEmpty) {
          return const Center(child: CircularProgressIndicator(color: AppColors.primary));
        }
        if (_ctrl.wishlist.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.favorite_border_rounded, size: 48, color: context.textSecondary),
                  const SizedBox(height: 12),
                  Text('Your wishlist is empty', style: TextStyle(color: context.textSecondary, fontFamily: 'Inter', fontSize: 14)),
                  const SizedBox(height: 4),
                  Text('Tap the heart on any product to save it here',
                      style: TextStyle(color: context.textSecondary, fontFamily: 'Inter', fontSize: 12)),
                ],
              ),
            ),
          );
        }
        return GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.62,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: _ctrl.wishlist.length,
          itemBuilder: (_, i) {
            final product = _ctrl.wishlist[i];
            return ProductCard(
              product: product,
              onTap: () => Get.toNamed('/product/${product.id}'),
            );
          },
        );
      }),
    );
  }
}
