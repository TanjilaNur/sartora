import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/points_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../../data/models/points_ledger_model.dart';

class PointsScreen extends StatelessWidget {
  const PointsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.find<PointsController>();

    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        title: const Text(
          'My Points',
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
            onPressed: () => ctrl.fetchPoints(),
          ),
        ],
      ),
      body: Obx(() {
        if (ctrl.isLoading.value && ctrl.history.isEmpty) {
          return const Center(
              child: CircularProgressIndicator(color: AppColors.primary));
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => ctrl.fetchPoints(),
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(child: _BalanceCard(balance: ctrl.balance.value)),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Text(
                    'Points History',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: context.textPrimary,
                      fontFamily: 'Inter',
                    ),
                  ),
                ),
              ),
              if (ctrl.history.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Text(
                      'No points history yet.\nStart shopping to earn points!',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: context.textSecondary,
                        fontFamily: 'Inter',
                        fontSize: 14,
                      ),
                    ),
                  ),
                )
              else
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, i) {
                      if (i < ctrl.history.length) {
                        return _HistoryTile(entry: ctrl.history[i]);
                      }
                      // Load more trigger — deferred to after this frame so
                      // the resulting isLoading update doesn't call setState
                      // while this very sliver is still being built.
                      if (ctrl.currentPage.value < ctrl.totalPages.value) {
                        WidgetsBinding.instance.addPostFrameCallback(
                            (_) => ctrl.loadMoreHistory());
                        return const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(
                              child: CircularProgressIndicator(
                                  color: AppColors.primary)),
                        );
                      }
                      return const SizedBox(height: 16);
                    },
                    childCount: ctrl.history.length + 1,
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  final int balance;
  const _BalanceCard({required this.balance});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
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
        children: [
          const Icon(Icons.stars_rounded, color: AppColors.secondary, size: 48),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Total Points',
                style: TextStyle(
                  color: AppColors.white,
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '$balance pts',
                style: const TextStyle(
                  color: AppColors.white,
                  fontFamily: 'Inter',
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  final PointsLedgerModel entry;
  const _HistoryTile({required this.entry});

  IconData _iconForEvent(String event) {
    switch (event) {
      case 'signup':
        return Icons.person_add_rounded;
      case 'purchase':
        return Icons.shopping_bag_rounded;
      case 'review':
        return Icons.star_rounded;
      default:
        return Icons.bolt_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
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
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: context.primaryTintBackground,
          child: Icon(_iconForEvent(entry.event),
              color: context.onPrimaryTintBackground, size: 20),
        ),
        title: Text(
          entry.description,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: context.textPrimary,
            fontFamily: 'Inter',
          ),
        ),
        subtitle: Text(
          _formatDate(entry.createdAt),
          style: TextStyle(
            fontSize: 12,
            color: context.textSecondary,
            fontFamily: 'Inter',
          ),
        ),
        trailing: Text(
          '+${entry.points} pts',
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppColors.success,
            fontFamily: 'Inter',
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}
