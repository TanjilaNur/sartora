import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/points_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';

class RewardsScreen extends StatelessWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.find<PointsController>();

    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        title: const Text(
          'Rewards',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
            fontSize: 20,
          ),
        ),
        iconTheme: const IconThemeData(color: AppColors.white),
      ),
      body: Obx(() => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _BalanceSummaryCard(
                balance: ctrl.balance.value,
                earnedCount: ctrl.earnedBadges.length,
                myRank: ctrl.myRank.value != null
                    ? (ctrl.myRank.value!['rank'] as num?)?.toInt()
                    : null,
              ),
              const SizedBox(height: 16),
              _NavCard(
                icon: Icons.stars_rounded,
                iconColor: AppColors.secondary,
                title: 'My Points',
                subtitle: 'View your points balance and history',
                onTap: () => Get.toNamed('/points'),
              ),
              const SizedBox(height: 12),
              _NavCard(
                icon: Icons.emoji_events_rounded,
                iconColor: AppColors.warning,
                title: 'My Badges',
                subtitle: 'See earned and locked achievement badges',
                onTap: () => Get.toNamed('/badges'),
              ),
              const SizedBox(height: 12),
              _NavCard(
                icon: Icons.leaderboard_rounded,
                iconColor: AppColors.primary,
                title: 'Leaderboard',
                subtitle: 'See how you rank against other shoppers',
                onTap: () => Get.toNamed('/leaderboard'),
              ),
              const SizedBox(height: 24),
              const _HowToEarnCard(),
            ],
          )),
    );
  }
}

class _BalanceSummaryCard extends StatelessWidget {
  final int balance;
  final int earnedCount;
  final int? myRank;

  const _BalanceSummaryCard({
    required this.balance,
    required this.earnedCount,
    this.myRank,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, Color(0xFF5B21B6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x33660033),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StatChip(
            label: 'Points',
            value: '$balance',
            icon: Icons.stars_rounded,
          ),
          Container(width: 1, height: 40, color: AppColors.white.withValues(alpha:0.3)),
          _StatChip(
            label: 'Badges',
            value: '$earnedCount',
            icon: Icons.emoji_events_rounded,
          ),
          Container(width: 1, height: 40, color: AppColors.white.withValues(alpha:0.3)),
          _StatChip(
            label: 'Rank',
            value: myRank != null ? '#$myRank' : '—',
            icon: Icons.leaderboard_rounded,
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _StatChip({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: AppColors.secondary, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: AppColors.white,
            fontFamily: 'Inter',
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            color: AppColors.white.withValues(alpha:0.8),
            fontFamily: 'Inter',
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}

class _NavCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _NavCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.surfaceColor,
          borderRadius: BorderRadius.circular(12),
          boxShadow: const [
            BoxShadow(
              color: Color(0x14000000),
              blurRadius: 4,
              offset: Offset(0, 1),
            ),
          ],
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: iconColor.withValues(alpha:0.12),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: context.textPrimary,
                      fontFamily: 'Inter',
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: context.textSecondary,
                      fontFamily: 'Inter',
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: context.borderColor),
          ],
        ),
      ),
    );
  }
}

class _HowToEarnCard extends StatelessWidget {
  const _HowToEarnCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.primaryTintBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withValues(alpha:0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'How to earn points',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: context.onPrimaryTintBackground,
              fontFamily: 'Inter',
            ),
          ),
          const SizedBox(height: 10),
          _EarnRow(icon: Icons.person_add_rounded, text: 'Sign up — 50 pts'),
          _EarnRow(icon: Icons.shopping_bag_rounded, text: 'Make a purchase — 10 pts'),
          _EarnRow(icon: Icons.star_rounded, text: 'Write a review — 20 pts'),
        ],
      ),
    );
  }
}

class _EarnRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _EarnRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, color: context.onPrimaryTintBackground, size: 16),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(
              fontSize: 13,
              color: context.textPrimary,
              fontFamily: 'Inter',
            ),
          ),
        ],
      ),
    );
  }
}
