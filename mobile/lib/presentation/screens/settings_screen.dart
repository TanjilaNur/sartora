import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/auth_controller.dart';
import '../../controllers/biometric_controller.dart';
import '../../controllers/profile_controller.dart';
import '../../controllers/theme_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themeCtrl = Get.find<ThemeController>();
    final biometric = Get.find<BiometricController>();
    final auth = Get.find<AuthController>();
    final profile = Get.find<ProfileController>();
    final cs = Theme.of(context).colorScheme;
    final isDark = cs.brightness == Brightness.dark;

    Future<void> confirmDeleteAccount() async {
      final confirmed = await Get.dialog<bool>(AlertDialog(
        title: const Text('Delete account?'),
        content: const Text(
          'This deactivates your account and removes your personal information. Your order history is kept for records but you will not be able to sign in again. This cannot be undone.',
        ),
        actions: [
          TextButton(onPressed: () => Get.back(result: false), child: const Text('Cancel')),
          TextButton(onPressed: () => Get.back(result: true), child: const Text('Delete Account', style: TextStyle(color: AppColors.danger))),
        ],
      ));
      if (confirmed != true) return;
      final ok = await profile.deleteAccount();
      if (ok) {
        await auth.logout();
      } else if (profile.errorMessage.value.isNotEmpty) {
        Get.snackbar('Could not delete account', profile.errorMessage.value,
            backgroundColor: AppColors.danger, colorText: AppColors.white);
      }
    }

    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        title: const Text(
          'Settings',
          style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w700, fontFamily: 'Inter', fontSize: 20),
        ),
        iconTheme: const IconThemeData(color: AppColors.white),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        children: [
          _SectionLabel(label: 'ACCOUNT'),
          const SizedBox(height: 8),
          _NavTile(
            icon: Icons.person_outline_rounded,
            iconColor: AppColors.primary,
            title: 'Edit Profile',
            subtitle: 'Name, email, and phone number',
            isDark: isDark,
            onTap: () => Get.toNamed('/profile-edit'),
          ),
          _NavTile(
            icon: Icons.location_on_outlined,
            iconColor: AppColors.secondary,
            title: 'My Addresses',
            subtitle: 'Manage your saved delivery addresses',
            isDark: isDark,
            onTap: () => Get.toNamed('/addresses'),
          ),
          _NavTile(
            icon: Icons.favorite_border_rounded,
            iconColor: AppColors.warning,
            title: 'My Wishlist',
            subtitle: 'Products you\'ve saved for later',
            isDark: isDark,
            onTap: () => Get.toNamed('/wishlist'),
          ),
          const SizedBox(height: 24),
          _SectionLabel(label: 'APPEARANCE'),
          const SizedBox(height: 8),
          _SettingsTile(
            icon: Icons.dark_mode_rounded,
            iconColor: AppColors.primary,
            title: 'Dark Mode',
            subtitle: 'Switch between light and dark theme',
            isDark: isDark,
            trailing: Obx(
              () => Switch(
                value: themeCtrl.isDarkMode.value,
                onChanged: (v) => themeCtrl.setDarkMode(v),
              ),
            ),
          ),
          Obx(() {
            if (!biometric.isAvailable.value) return const SizedBox.shrink();
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 24),
                _SectionLabel(label: 'SECURITY'),
                const SizedBox(height: 8),
                _SettingsTile(
                  icon: Icons.fingerprint_rounded,
                  iconColor: AppColors.success,
                  title: 'App Lock',
                  subtitle: 'Require Face ID / Touch ID / fingerprint to open the app',
                  isDark: isDark,
                  trailing: Switch(
                    value: biometric.isEnabled.value,
                    onChanged: (v) => biometric.setEnabled(v),
                  ),
                ),
              ],
            );
          }),
          const SizedBox(height: 24),
          _SectionLabel(label: 'NOTIFICATIONS'),
          const SizedBox(height: 8),
          Obx(() {
            final notificationsEnabled = auth.user.value?.notificationsEnabled ?? true;
            return _SettingsTile(
              icon: Icons.notifications_outlined,
              iconColor: AppColors.primary,
              title: 'Notifications',
              subtitle: 'Push notifications for orders and updates',
              isDark: isDark,
              trailing: Switch(
                value: notificationsEnabled,
                onChanged: (v) => profile.updateNotificationsEnabled(v),
              ),
            );
          }),
          const SizedBox(height: 24),
          _SectionLabel(label: 'ABOUT'),
          const SizedBox(height: 8),
          _InfoTile(icon: Icons.info_outline_rounded, iconColor: AppColors.neutral600, title: 'App Version', value: '1.0.0', isDark: isDark),
          _InfoTile(icon: Icons.storefront_rounded, iconColor: AppColors.secondary, title: 'Store', value: 'Sartora', isDark: isDark),
          const SizedBox(height: 24),
          _SectionLabel(label: 'DANGER ZONE'),
          const SizedBox(height: 8),
          _NavTile(
            icon: Icons.delete_outline_rounded,
            iconColor: AppColors.danger,
            title: 'Delete Account',
            subtitle: 'Permanently deactivate your account',
            isDark: isDark,
            titleColor: AppColors.danger,
            onTap: confirmDeleteAccount,
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: AppColors.primary,
        letterSpacing: 1.2,
        fontFamily: 'Inter',
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final Widget trailing;
  final bool isDark;

  const _SettingsTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.trailing,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return _TileShell(
      isDark: isDark,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: _IconBox(icon: icon, color: iconColor),
        title: Text(
          title,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            fontFamily: 'Inter',
            color: isDark ? Colors.white : AppColors.neutral900,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            fontSize: 12,
            fontFamily: 'Inter',
            color: isDark ? const Color(0xFF9CA3AF) : AppColors.neutral600,
          ),
        ),
        trailing: trailing,
      ),
    );
  }
}

class _NavTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final bool isDark;
  final VoidCallback onTap;
  final Color? titleColor;

  const _NavTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.isDark,
    required this.onTap,
    this.titleColor,
  });

  @override
  Widget build(BuildContext context) {
    return _TileShell(
      isDark: isDark,
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: _IconBox(icon: icon, color: iconColor),
        title: Text(
          title,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            fontFamily: 'Inter',
            color: titleColor ?? (isDark ? Colors.white : AppColors.neutral900),
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            fontSize: 12,
            fontFamily: 'Inter',
            color: isDark ? const Color(0xFF9CA3AF) : AppColors.neutral600,
          ),
        ),
        trailing: Icon(Icons.chevron_right_rounded, color: isDark ? const Color(0xFF9CA3AF) : AppColors.neutral600),
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String value;
  final bool isDark;

  const _InfoTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.value,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: _TileShell(
        isDark: isDark,
        child: ListTile(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          leading: _IconBox(icon: icon, color: iconColor),
          title: Text(
            title,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              fontFamily: 'Inter',
              color: isDark ? Colors.white : AppColors.neutral900,
            ),
          ),
          trailing: Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontFamily: 'Inter',
              color: isDark ? const Color(0xFF9CA3AF) : AppColors.neutral600,
            ),
          ),
        ),
      ),
    );
  }
}

class _TileShell extends StatelessWidget {
  final Widget child;
  final bool isDark;
  const _TileShell({required this.child, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.06),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      // A ListTile paints its background/ink splashes on the nearest
      // Material ancestor — without one here, tapping a tile (e.g. Delete
      // Account, or any _NavTile) shows no ripple feedback at all, since the
      // DecoratedBox above has nothing for it to paint onto. `transparency`
      // contributes no color/elevation of its own, so the outer Container's
      // decoration still shows through unchanged.
      child: Material(
        type: MaterialType.transparency,
        child: child,
      ),
    );
  }
}

class _IconBox extends StatelessWidget {
  final IconData icon;
  final Color color;
  const _IconBox({required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(icon, color: color, size: 22),
    );
  }
}
