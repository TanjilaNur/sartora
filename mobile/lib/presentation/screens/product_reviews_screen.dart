import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/auth_controller.dart';
import '../../controllers/review_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../../data/models/review_model.dart';

class ProductReviewsScreen extends StatefulWidget {
  final String productId;
  final String productName;

  const ProductReviewsScreen({
    super.key,
    required this.productId,
    required this.productName,
  });

  @override
  State<ProductReviewsScreen> createState() => _ProductReviewsScreenState();
}

class _ProductReviewsScreenState extends State<ProductReviewsScreen> {
  late final ReviewController _reviewCtrl;
  late final AuthController _authCtrl;
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    // Same tagged instance ProductDetailScreen put for this productId — it's
    // always the one that pushed this route, so it's already registered.
    _reviewCtrl = Get.find<ReviewController>(tag: widget.productId);
    _authCtrl = Get.find<AuthController>();
    _reviewCtrl.fetchProductReviews(widget.productId);
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >=
          _scrollController.position.maxScrollExtent - 200) {
        _reviewCtrl.loadMoreReviews();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  String? get _currentUserId => _authCtrl.user.value?.id;

  void _showReviewDialog({ReviewModel? existing}) {
    int selectedRating = existing?.rating ?? 5;
    final textCtrl = TextEditingController(text: existing?.text ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
          ),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: context.surfaceColor,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      existing != null ? 'Edit Review' : 'Write a Review',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: context.textPrimary,
                        fontFamily: 'Inter',
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () => Navigator.pop(ctx),
                      icon: Icon(Icons.close, color: context.textSecondary),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  widget.productName,
                  style: TextStyle(
                    fontSize: 13,
                    color: context.textSecondary,
                    fontFamily: 'Inter',
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Rating',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: context.textPrimary,
                    fontFamily: 'Inter',
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: List.generate(5, (i) {
                    final star = i + 1;
                    return GestureDetector(
                      onTap: () => setModalState(() => selectedRating = star),
                      child: Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: Icon(
                          star <= selectedRating
                              ? Icons.star_rounded
                              : Icons.star_outline_rounded,
                          size: 36,
                          color: AppColors.secondary,
                        ),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: textCtrl,
                  maxLines: 3,
                  style: TextStyle(
                    fontSize: 14,
                    fontFamily: 'Inter',
                    color: context.textPrimary,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Share your experience (optional)',
                    hintStyle: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 13,
                      color: context.textSecondary,
                    ),
                    filled: true,
                    fillColor: context.pageBackground,
                    contentPadding: const EdgeInsets.all(14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: context.borderColor),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: context.borderColor),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide:
                          const BorderSide(color: AppColors.primary, width: 1.5),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Obx(() => SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _reviewCtrl.isSubmitting.value
                            ? null
                            : () async {
                                bool ok;
                                if (existing != null) {
                                  ok = await _reviewCtrl.editReview(
                                    existing.id,
                                    selectedRating,
                                    textCtrl.text.trim(),
                                  );
                                } else {
                                  ok = await _reviewCtrl.addReview(
                                    widget.productId,
                                    selectedRating,
                                    textCtrl.text.trim(),
                                  );
                                }
                                if (ok && ctx.mounted) Navigator.pop(ctx);
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                          disabledBackgroundColor:
                              AppColors.primary.withValues(alpha: 0.6),
                        ),
                        child: _reviewCtrl.isSubmitting.value
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2.5,
                                    color: AppColors.white),
                              )
                            : Text(
                                existing != null
                                    ? 'Update Review'
                                    : 'Submit Review',
                                style: const TextStyle(
                                  color: AppColors.white,
                                  fontFamily: 'Inter',
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15,
                                ),
                              ),
                      ),
                    )),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        iconTheme: const IconThemeData(color: AppColors.white),
        title: const Text(
          'Reviews',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
            fontSize: 20,
          ),
        ),
      ),
      floatingActionButton: Obx(() {
        final userId = _currentUserId;
        if (userId == null) return const SizedBox.shrink();
        if (_reviewCtrl.hasUserReviewed.value) return const SizedBox.shrink();
        return FloatingActionButton.extended(
          onPressed: () => _showReviewDialog(),
          backgroundColor: AppColors.primary,
          icon: const Icon(Icons.rate_review_outlined, color: AppColors.white),
          label: const Text(
            'Write Review',
            style: TextStyle(
              color: AppColors.white,
              fontFamily: 'Inter',
              fontWeight: FontWeight.w600,
            ),
          ),
        );
      }),
      body: Obx(() {
        if (_reviewCtrl.isLoading.value) {
          return const Center(
              child: CircularProgressIndicator(color: AppColors.primary));
        }

        if (_reviewCtrl.reviews.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.reviews_outlined,
                    size: 64, color: context.borderColor),
                const SizedBox(height: 16),
                Text(
                  'No reviews yet',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: context.textSecondary,
                    fontFamily: 'Inter',
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Be the first to review this product.',
                  style: TextStyle(
                    fontSize: 13,
                    color: context.textSecondary,
                    fontFamily: 'Inter',
                  ),
                ),
                if (_currentUserId != null) ...[
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: () => _showReviewDialog(),
                    icon: const Icon(Icons.rate_review_outlined,
                        color: AppColors.white),
                    label: const Text(
                      'Write a Review',
                      style: TextStyle(
                        color: AppColors.white,
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 12),
                    ),
                  ),
                ],
              ],
            ),
          );
        }

        return Column(
          children: [
            _RatingSummary(
              average: _reviewCtrl.averageRating.value,
              total: _reviewCtrl.totalCount.value,
            ),
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                itemCount: _reviewCtrl.reviews.length +
                    (_reviewCtrl.isLoadingMore.value ? 1 : 0),
                itemBuilder: (_, i) {
                  if (i >= _reviewCtrl.reviews.length) {
                    return const Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(
                          child: CircularProgressIndicator(
                              color: AppColors.primary, strokeWidth: 2)),
                    );
                  }
                  final review = _reviewCtrl.reviews[i];
                  final isOwn = review.userId == _currentUserId;
                  return _ReviewCard(
                    review: review,
                    isOwn: isOwn,
                    onEdit: () => _showReviewDialog(existing: review),
                    onDelete: () async {
                      final confirmed = await showDialog<bool>(
                        context: context,
                        builder: (_) => AlertDialog(
                          title: const Text('Delete Review',
                              style: TextStyle(fontFamily: 'Inter')),
                          content: const Text('Remove your review?',
                              style: TextStyle(fontFamily: 'Inter')),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context, false),
                              child: Text('Cancel',
                                  style: TextStyle(
                                      fontFamily: 'Inter',
                                      color: context.textSecondary)),
                            ),
                            TextButton(
                              onPressed: () => Navigator.pop(context, true),
                              child: const Text('Delete',
                                  style: TextStyle(
                                      fontFamily: 'Inter',
                                      color: AppColors.danger,
                                      fontWeight: FontWeight.w600)),
                            ),
                          ],
                        ),
                      );
                      if (confirmed == true) {
                        await _reviewCtrl.deleteReview(review.id);
                      }
                    },
                    onReport: () => _reviewCtrl.reportReview(review.id),
                  );
                },
              ),
            ),
          ],
        );
      }),
    );
  }
}

class _RatingSummary extends StatelessWidget {
  final double average;
  final int total;

  const _RatingSummary({required this.average, required this.total});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: context.surfaceColor,
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
      child: Row(
        children: [
          Column(
            children: [
              Text(
                average.toStringAsFixed(1),
                style: TextStyle(
                  fontSize: 40,
                  fontWeight: FontWeight.w700,
                  color: context.textPrimary,
                  fontFamily: 'Inter',
                ),
              ),
              Row(
                children: List.generate(5, (i) {
                  if (i < average.floor()) {
                    return const Icon(Icons.star_rounded,
                        size: 16, color: AppColors.secondary);
                  } else if (i < average) {
                    return const Icon(Icons.star_half_rounded,
                        size: 16, color: AppColors.secondary);
                  }
                  return const Icon(Icons.star_outline_rounded,
                      size: 16, color: AppColors.secondary);
                }),
              ),
              const SizedBox(height: 4),
              Text(
                '$total review${total == 1 ? '' : 's'}',
                style: TextStyle(
                  fontSize: 12,
                  color: context.textSecondary,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final ReviewModel review;
  final bool isOwn;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onReport;

  const _ReviewCard({
    required this.review,
    required this.isOwn,
    required this.onEdit,
    required this.onDelete,
    required this.onReport,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.surfaceColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 4,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: context.primaryTintBackground,
                child: Text(
                  review.userName.isNotEmpty
                      ? review.userName[0].toUpperCase()
                      : '?',
                  style: TextStyle(
                    color: context.onPrimaryTintBackground,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Inter',
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          review.userName,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: context.textPrimary,
                            fontFamily: 'Inter',
                          ),
                        ),
                        if (review.verified) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color:
                                  AppColors.success.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'Verified',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: AppColors.success,
                                fontFamily: 'Inter',
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    Text(
                      _formatDate(review.createdAt),
                      style: TextStyle(
                        fontSize: 11,
                        color: context.textSecondary,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                onSelected: (val) {
                  if (val == 'edit') onEdit();
                  if (val == 'delete') onDelete();
                  if (val == 'report') onReport();
                },
                itemBuilder: (_) => [
                  if (isOwn) ...[
                    PopupMenuItem(
                      value: 'edit',
                      child: Row(
                        children: [
                          Icon(Icons.edit_outlined,
                              size: 18, color: context.textSecondary),
                          const SizedBox(width: 8),
                          const Text('Edit',
                              style: TextStyle(fontFamily: 'Inter')),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete_outline,
                              size: 18, color: AppColors.danger),
                          SizedBox(width: 8),
                          Text('Delete',
                              style: TextStyle(
                                  fontFamily: 'Inter',
                                  color: AppColors.danger)),
                        ],
                      ),
                    ),
                  ] else
                    const PopupMenuItem(
                      value: 'report',
                      child: Row(
                        children: [
                          Icon(Icons.flag_outlined,
                              size: 18, color: AppColors.warning),
                          SizedBox(width: 8),
                          Text('Report',
                              style: TextStyle(fontFamily: 'Inter')),
                        ],
                      ),
                    ),
                ],
                icon: Icon(Icons.more_vert,
                    color: context.textSecondary, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: List.generate(5, (i) => Icon(
                  i < review.rating
                      ? Icons.star_rounded
                      : Icons.star_outline_rounded,
                  size: 16,
                  color: AppColors.secondary,
                )),
          ),
          if (review.text.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              review.text,
              style: TextStyle(
                fontSize: 13,
                color: context.textSecondary,
                fontFamily: 'Inter',
                height: 1.5,
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}
