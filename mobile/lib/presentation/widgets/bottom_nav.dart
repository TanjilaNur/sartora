import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/cart_controller.dart';
import '../../core/constants/app_colors.dart';

class AppBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const AppBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cartCtrl = Get.find<CartController>();

    return BottomNavigationBar(
      currentIndex: currentIndex,
      onTap: onTap,
      selectedLabelStyle: const TextStyle(fontFamily: 'Inter', fontSize: 12),
      unselectedLabelStyle: const TextStyle(fontFamily: 'Inter', fontSize: 12),
      type: BottomNavigationBarType.fixed,
      items: [
        const BottomNavigationBarItem(
          icon: Icon(Icons.home_outlined),
          activeIcon: Icon(Icons.home_rounded),
          label: 'Home',
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.grid_view_outlined),
          activeIcon: Icon(Icons.grid_view_rounded),
          label: 'Catalog',
        ),
        BottomNavigationBarItem(
          icon: Obx(() {
            final count = cartCtrl.itemCount;
            return Badge(
              isLabelVisible: count > 0,
              label: Text(
                '$count',
                style: const TextStyle(fontSize: 10, color: AppColors.white),
              ),
              backgroundColor: AppColors.secondary,
              child: const Icon(Icons.shopping_cart_outlined),
            );
          }),
          activeIcon: Obx(() {
            final count = cartCtrl.itemCount;
            return Badge(
              isLabelVisible: count > 0,
              label: Text(
                '$count',
                style: const TextStyle(fontSize: 10, color: AppColors.white),
              ),
              backgroundColor: AppColors.secondary,
              child: const Icon(Icons.shopping_cart_rounded),
            );
          }),
          label: 'Cart',
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.receipt_long_outlined),
          activeIcon: Icon(Icons.receipt_long_rounded),
          label: 'Orders',
        ),
      ],
    );
  }
}
