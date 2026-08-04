import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/points_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../../data/models/badge_model.dart';

class BadgesScreen extends StatelessWidget {
  const BadgesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.find<PointsController>();

    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        title: const Text(
          'My Badges',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
            fontSize: 20,
          ),
        ),
        iconTheme: const IconThemeData(color: AppColors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.white),
            onPressed: () => ctrl.fetchBadges(),
          ),
        ],
      ),
      body: Obx(() {
        if (ctrl.badgesLoading.value &&
            ctrl.earnedBadges.isEmpty &&
            ctrl.lockedBadges.isEmpty) {
          return const Center(
              child: CircularProgressIndicator(color: AppColors.primary));
        }

        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => ctrl.fetchBadges(),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (ctrl.earnedBadges.isNotEmpty) ...[
                _SectionHeader(
                  title: 'Earned (${ctrl.earnedBadges.length})',
                  color: AppColors.success,
                ),
                const SizedBox(height: 8),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 1.1,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: ctrl.earnedBadges.length,
                  itemBuilder: (_, i) =>
                      _BadgeCard(badge: ctrl.earnedBadges[i].badge, earned: true),
                ),
                const SizedBox(height: 20),
              ],
              if (ctrl.lockedBadges.isNotEmpty) ...[
                _SectionHeader(
                  title: 'Locked (${ctrl.lockedBadges.length})',
                  color: context.textSecondary,
                ),
                const SizedBox(height: 8),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 1.1,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: ctrl.lockedBadges.length,
                  itemBuilder: (_, i) =>
                      _BadgeCard(badge: ctrl.lockedBadges[i], earned: false),
                ),
              ],
              if (ctrl.earnedBadges.isEmpty && ctrl.lockedBadges.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Text(
                      'No badges available yet.',
                      style: TextStyle(
                        color: context.textSecondary,
                        fontFamily: 'Inter',
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final Color color;
  const _SectionHeader({required this.title, required this.color});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: color,
        fontFamily: 'Inter',
      ),
    );
  }
}

class _BadgeCard extends StatelessWidget {
  final BadgeModel badge;
  final bool earned;
  const _BadgeCard({required this.badge, required this.earned});

  IconData _iconForCriteriaType(String type) {
    switch (type) {
      case 'order_count':
        return Icons.shopping_bag_rounded;
      case 'review_count':
        return Icons.rate_review_rounded;
      case 'points_threshold':
        return Icons.stars_rounded;
      default:
        return Icons.emoji_events_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.surfaceColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: earned ? AppColors.success : context.borderColor,
          width: 1.5,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 4,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              alignment: Alignment.topRight,
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor:
                      earned ? AppColors.success.withValues(alpha: 0.15) : context.pageBackground,
                  child: Icon(
                    _iconForCriteriaType(badge.criteria.type),
                    color: earned ? AppColors.success : context.borderColor,
                    size: 28,
                  ),
                ),
                if (!earned)
                  CircleAvatar(
                    radius: 9,
                    backgroundColor: context.borderColor,
                    child: const Icon(Icons.lock_rounded,
                        size: 10, color: AppColors.white),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              badge.name,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: earned ? context.textPrimary : context.textSecondary,
                fontFamily: 'Inter',
              ),
            ),
            const SizedBox(height: 2),
            Text(
              _criteriaLabel(badge.criteria),
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10,
                color: context.textSecondary,
                fontFamily: 'Inter',
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _criteriaLabel(BadgeCriteria c) {
    switch (c.type) {
      case 'order_count':
        return '${c.value} order${c.value == 1 ? '' : 's'}';
      case 'review_count':
        return '${c.value} review${c.value == 1 ? '' : 's'}';
      case 'points_threshold':
        return '${c.value} pts';
      default:
        return '';
    }
  }
}
