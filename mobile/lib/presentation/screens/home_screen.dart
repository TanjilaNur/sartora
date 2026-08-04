import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/auth_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../widgets/bottom_nav.dart';
import 'catalog_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tabIndex = 0;

  static const _titles = ['Home', 'Catalog'];

  void _onTabChanged(int index) {
    if (index == 2) {
      Get.toNamed('/cart');
      return;
    }
    if (index == 3) {
      Get.toNamed('/orders');
      return;
    }
    setState(() => _tabIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final auth = Get.find<AuthController>();

    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        title: Text(
          _titles[_tabIndex],
          style: const TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
            fontSize: 20,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_rounded, color: AppColors.white),
            tooltip: 'Settings',
            onPressed: () => Get.toNamed('/settings'),
          ),
          Obx(() => auth.isLoading.value
              ? const Padding(
                  padding: EdgeInsets.all(16),
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: AppColors.white),
                  ),
                )
              : IconButton(
                  icon: const Icon(Icons.logout_rounded, color: AppColors.white),
                  tooltip: 'Logout',
                  onPressed: auth.logout,
                )),
        ],
      ),
      body: IndexedStack(
        index: _tabIndex,
        children: const [
          _WelcomeTab(),
          CatalogScreen(),
        ],
      ),
      bottomNavigationBar: AppBottomNav(
        currentIndex: _tabIndex,
        onTap: _onTabChanged,
      ),
    );
  }
}

class _WelcomeTab extends StatelessWidget {
  const _WelcomeTab();

  @override
  Widget build(BuildContext context) {
    final auth = Get.find<AuthController>();

    return Center(
      child: Obx(() => Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: context.primaryTintBackground,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Icon(Icons.storefront_rounded,
                      color: context.onPrimaryTintBackground, size: 48),
                ),
                const SizedBox(height: 20),
                Text(
                  'Welcome, ${auth.user.value?.name ?? 'User'}!',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: context.textPrimary,
                    fontFamily: 'Inter',
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Discover our latest collection of dresses.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: context.textSecondary,
                    fontFamily: 'Inter',
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      final homeState = context
                          .findAncestorStateOfType<_HomeScreenState>();
                      homeState?._onTabChanged(1);
                    },
                    icon: const Icon(Icons.grid_view_rounded,
                        color: AppColors.white),
                    label: const Text(
                      'Browse Products',
                      style: TextStyle(
                        color: AppColors.white,
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => Get.toNamed('/orders'),
                    icon: const Icon(Icons.receipt_long_rounded,
                        color: AppColors.primary),
                    label: const Text(
                      'My Orders',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.primary),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => Get.toNamed('/rewards'),
                    icon: const Icon(Icons.stars_rounded,
                        color: AppColors.secondary),
                    label: const Text(
                      'Rewards & Leaderboard',
                      style: TextStyle(
                        color: AppColors.secondary,
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.secondary),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => Get.toNamed('/help'),
                    icon: Icon(Icons.help_outline_rounded,
                        color: context.textSecondary),
                    label: Text(
                      'Help & Support',
                      style: TextStyle(
                        color: context.textSecondary,
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: context.borderColor),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
              ],
            ),
          )),
    );
  }
}
