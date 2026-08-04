import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/points_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../../data/models/badge_model.dart';

class LeaderboardScreen extends StatelessWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.find<PointsController>();

    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        title: const Text(
          'Leaderboard',
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
            onPressed: () => ctrl.fetchLeaderboard(),
          ),
        ],
      ),
      body: Obx(() {
        if (ctrl.leaderboardLoading.value && ctrl.leaderboard.isEmpty) {
          return const Center(
              child: CircularProgressIndicator(color: AppColors.primary));
        }

        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => ctrl.fetchLeaderboard(),
          child: Column(
            children: [
              if (ctrl.myRank.value != null) _MyRankBanner(myRank: ctrl.myRank.value!),
              Expanded(
                child: ctrl.leaderboard.isEmpty
                    ? Center(
                        child: Text(
                          'No leaderboard data yet.',
                          style: TextStyle(
                            color: context.textSecondary,
                            fontFamily: 'Inter',
                            fontSize: 14,
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: ctrl.leaderboard.length,
                        itemBuilder: (_, i) =>
                            _LeaderboardTile(entry: ctrl.leaderboard[i]),
                      ),
              ),
            ],
          ),
        );
      }),
    );
  }
}

class _MyRankBanner extends StatelessWidget {
  final Map<String, dynamic> myRank;
  const _MyRankBanner({required this.myRank});

  @override
  Widget build(BuildContext context) {
    final rank = (myRank['rank'] as num?)?.toInt() ?? 0;
    final points = (myRank['points'] as num?)?.toInt() ?? 0;

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: context.primaryTintBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(Icons.person_rounded, color: context.onPrimaryTintBackground),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Your rank: #$rank',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: context.onPrimaryTintBackground,
                fontFamily: 'Inter',
              ),
            ),
          ),
          Text(
            '$points pts',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: context.onPrimaryTintBackground,
              fontFamily: 'Inter',
            ),
          ),
        ],
      ),
    );
  }
}

class _LeaderboardTile extends StatelessWidget {
  final LeaderboardEntry entry;
  const _LeaderboardTile({required this.entry});

  @override
  Widget build(BuildContext context) {
    final isTopThree = entry.rank <= 3;
    final medalColors = [
      const Color(0xFFFFD700), // gold
      const Color(0xFFC0C0C0), // silver
      const Color(0xFFCD7F32), // bronze
    ];

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: context.surfaceColor,
        borderRadius: BorderRadius.circular(12),
        border: isTopThree
            ? Border.all(color: medalColors[entry.rank - 1].withValues(alpha: 0.5))
            : null,
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 4,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: ListTile(
        leading: isTopThree
            ? CircleAvatar(
                backgroundColor: medalColors[entry.rank - 1].withValues(alpha: 0.15),
                child: Text(
                  _medal(entry.rank),
                  style: const TextStyle(fontSize: 20),
                ),
              )
            : CircleAvatar(
                backgroundColor: context.pageBackground,
                child: Text(
                  '#${entry.rank}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: context.textSecondary,
                    fontFamily: 'Inter',
                  ),
                ),
              ),
        title: Text(
          entry.name ?? 'Anonymous',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: context.textPrimary,
            fontFamily: 'Inter',
          ),
        ),
        trailing: Text(
          '${entry.points} pts',
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppColors.primary,
            fontFamily: 'Inter',
          ),
        ),
      ),
    );
  }

  String _medal(int rank) {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '#$rank';
    }
  }
}
