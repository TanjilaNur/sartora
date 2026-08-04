import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/guest_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import 'catalog_screen.dart';

class GuestHomeScreen extends StatefulWidget {
  const GuestHomeScreen({super.key});

  @override
  State<GuestHomeScreen> createState() => _GuestHomeScreenState();
}

class _GuestHomeScreenState extends State<GuestHomeScreen> {
  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    Get.find<GuestController>().fetchGuestCart();
  }

  void _onTabChanged(int index) {
    if (index == 1) {
      Get.toNamed('/guest-cart');
      return;
    }
    setState(() => _tabIndex = 0);
  }

  @override
  Widget build(BuildContext context) {
    final guest = Get.find<GuestController>();

    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            const Text(
              'Sartora',
              style: TextStyle(
                color: AppColors.white,
                fontWeight: FontWeight.w700,
                fontFamily: 'Inter',
                fontSize: 20,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.secondary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'Guest',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.white,
                  fontFamily: 'Inter',
                ),
              ),
            ),
          ],
        ),
        actions: [
          Obx(() {
            final count = guest.itemCount;
            return Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.shopping_cart_outlined,
                      color: AppColors.white),
                  onPressed: () => Get.toNamed('/guest-cart'),
                ),
                if (count > 0)
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: const BoxDecoration(
                        color: AppColors.secondary,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '$count',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppColors.white,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ),
                  ),
              ],
            );
          }),
          TextButton(
            onPressed: () => _showSignInDialog(guest),
            child: const Text(
              'Sign In',
              style: TextStyle(
                color: AppColors.white,
                fontWeight: FontWeight.w600,
                fontFamily: 'Inter',
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
      body: const CatalogScreen(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _tabIndex,
        onTap: _onTabChanged,
        selectedLabelStyle: const TextStyle(fontFamily: 'Inter', fontSize: 12),
        unselectedLabelStyle:
            const TextStyle(fontFamily: 'Inter', fontSize: 12),
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.storefront_outlined),
            activeIcon: Icon(Icons.storefront_rounded),
            label: 'Catalog',
          ),
          BottomNavigationBarItem(
            icon: Obx(() {
              final count = guest.itemCount;
              return Stack(
                clipBehavior: Clip.none,
                children: [
                  const Icon(Icons.shopping_cart_outlined),
                  if (count > 0)
                    Positioned(
                      top: -4,
                      right: -8,
                      child: Container(
                        width: 16,
                        height: 16,
                        decoration: const BoxDecoration(
                          color: AppColors.secondary,
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '$count',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppColors.white,
                            fontFamily: 'Inter',
                          ),
                        ),
                      ),
                    ),
                ],
              );
            }),
            activeIcon: const Icon(Icons.shopping_cart_rounded),
            label: 'Cart',
          ),
        ],
      ),
    );
  }

  void _showSignInDialog(GuestController guest) {
    Get.dialog(
      AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Sign In',
          style: TextStyle(
            fontFamily: 'Inter',
            fontWeight: FontWeight.w700,
            fontSize: 18,
            color: context.textPrimary,
          ),
        ),
        content: Text(
          'Sign in to save your orders, track shipments, and sync your cart across devices.',
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
              'Stay as Guest',
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
              style: TextStyle(
                  fontFamily: 'Inter', fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
