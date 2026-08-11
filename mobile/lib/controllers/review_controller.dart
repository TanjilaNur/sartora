import 'dart:async';

import 'package:get/get.dart';
import '../core/constants/api_constants.dart';
import '../data/models/review_model.dart';
import '../services/api_service.dart';

class ReviewController extends GetxController {
  final RxList<ReviewModel> reviews = <ReviewModel>[].obs;
  final RxBool isLoading = false.obs;
  final RxBool isLoadingMore = false.obs;
  final RxBool isSubmitting = false.obs;
  final RxDouble averageRating = 0.0.obs;
  final RxInt totalCount = 0.obs;
  final RxInt currentPage = 1.obs;
  final RxInt totalPages = 1.obs;
  final RxBool hasUserReviewed = false.obs;
  String _currentProductId = '';

  // product_detail_screen.dart and product_reviews_screen.dart both fetch
  // page 1 of the same product's reviews on this shared controller, so two
  // concurrent calls can be in flight at once — either for the SAME product
  // (dedup: await the one already running) or for TWO DIFFERENT products if
  // the user navigates away before the first resolves (the newer one must
  // win; the older one's late result must never overwrite it). _requestId
  // makes the second case safe for deciding whether to *apply fetched data*.
  //
  // isLoading (page 1) and isLoadingMore (page > 1) are separate flags that
  // can be in flight at the same time (e.g. a load-more for product A races
  // a fresh page-1 open of product B on this same shared controller), so each
  // needs its OWN generation counter — resetting either flag must only be
  // skipped when superseded by another request of the SAME kind, never by an
  // unrelated request of the other kind.
  int _requestId = 0;
  int? _loadRequestId;
  int? _loadMoreRequestId;
  String? _inFlightProductId;
  Future<void>? _firstPageFetch;

  Future<void> fetchProductReviews(String productId, {int page = 1}) async {
    if (page == 1 && productId == _inFlightProductId && _firstPageFetch != null) {
      return _firstPageFetch;
    }

    _currentProductId = productId;
    final requestId = ++_requestId;
    if (page == 1) {
      isLoading.value = true;
      _inFlightProductId = productId;
      _loadRequestId = requestId;
    } else {
      isLoadingMore.value = true;
      _loadMoreRequestId = requestId;
    }

    final future = _fetchPage(productId, page, requestId);
    if (page == 1) _firstPageFetch = future;
    try {
      await future;
    } finally {
      if (page == 1 && _loadRequestId == requestId) {
        _firstPageFetch = null;
        _inFlightProductId = null;
      }
    }
  }

  Future<void> _fetchPage(String productId, int page, int requestId) async {
    try {
      final data = await ApiService.get(
        '${ApiConstants.reviews}/product/$productId?page=$page&limit=20',
      );
      if (requestId != _requestId) return; // superseded — discard stale result
      final raw = data['reviews'] as List<dynamic>? ?? [];
      if (page == 1) {
        reviews.value = raw
            .map((e) => ReviewModel.fromJson(e as Map<String, dynamic>))
            .toList();
      } else {
        reviews.addAll(raw
            .map((e) => ReviewModel.fromJson(e as Map<String, dynamic>)));
      }
      averageRating.value = (data['averageRating'] as num?)?.toDouble() ?? 0;
      totalCount.value = (data['total'] as num?)?.toInt() ?? 0;
      currentPage.value = (data['page'] as num?)?.toInt() ?? 1;
      totalPages.value = (data['pages'] as num?)?.toInt() ?? 1;
      if (page == 1) {
        unawaited(checkUserReviewed(productId));
      }
    } on ApiException catch (e) {
      if (requestId == _requestId) {
        Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
      }
    } catch (_) {
      if (requestId == _requestId) {
        Get.snackbar('Error', 'Failed to load reviews.',
            snackPosition: SnackPosition.BOTTOM);
      }
    } finally {
      if (page == 1) {
        if (requestId == _loadRequestId) isLoading.value = false;
      } else {
        if (requestId == _loadMoreRequestId) isLoadingMore.value = false;
      }
    }
  }

  Future<void> loadMoreReviews() async {
    if (isLoading.value || isLoadingMore.value) return;
    if (currentPage.value >= totalPages.value) return;
    await fetchProductReviews(_currentProductId, page: currentPage.value + 1);
  }

  /// Checks against the user's own reviews (not just the currently loaded
  /// page of this product's reviews) so the "Write Review" FAB stays hidden
  /// even when the user's review has been pushed past page 1 by newer ones.
  Future<void> checkUserReviewed(String productId) async {
    try {
      final data = await ApiService.get(
        '${ApiConstants.reviews}/my',
        withAuth: true,
      );
      final raw = data['reviews'] as List<dynamic>? ?? [];
      hasUserReviewed.value = raw
          .map((e) => ReviewModel.fromJson(e as Map<String, dynamic>))
          .any((r) => r.productId == productId);
    } catch (_) {
      // Guests (no auth) or a transient failure just leave the FAB visible;
      // submitting will still correctly fail with "already reviewed" if wrong.
    }
  }

  Future<bool> addReview(String productId, int rating, String text) async {
    isSubmitting.value = true;
    try {
      await ApiService.post(
        '${ApiConstants.reviews}/product/$productId',
        {'rating': rating, 'text': text},
        withAuth: true,
      );
      await fetchProductReviews(productId);
      Get.snackbar('Success', 'Your review has been submitted.',
          snackPosition: SnackPosition.BOTTOM);
      return true;
    } on ApiException catch (e) {
      Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
      return false;
    } catch (_) {
      Get.snackbar('Error', 'Failed to submit review.',
          snackPosition: SnackPosition.BOTTOM);
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  Future<bool> editReview(String reviewId, int rating, String text) async {
    isSubmitting.value = true;
    try {
      await ApiService.put(
        '${ApiConstants.reviews}/$reviewId',
        {'rating': rating, 'text': text},
        withAuth: true,
      );
      await fetchProductReviews(_currentProductId);
      Get.snackbar('Success', 'Review updated.',
          snackPosition: SnackPosition.BOTTOM);
      return true;
    } on ApiException catch (e) {
      Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
      return false;
    } catch (_) {
      Get.snackbar('Error', 'Failed to update review.',
          snackPosition: SnackPosition.BOTTOM);
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  Future<bool> deleteReview(String reviewId) async {
    isSubmitting.value = true;
    try {
      await ApiService.delete(
        '${ApiConstants.reviews}/$reviewId',
        withAuth: true,
      );
      await fetchProductReviews(_currentProductId);
      Get.snackbar('Deleted', 'Review removed.',
          snackPosition: SnackPosition.BOTTOM);
      return true;
    } on ApiException catch (e) {
      Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
      return false;
    } catch (_) {
      Get.snackbar('Error', 'Failed to delete review.',
          snackPosition: SnackPosition.BOTTOM);
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  Future<void> reportReview(String reviewId) async {
    try {
      await ApiService.post(
        '${ApiConstants.reviews}/$reviewId/report',
        {},
        withAuth: true,
      );
      Get.snackbar('Reported', 'Review has been flagged for moderation.',
          snackPosition: SnackPosition.BOTTOM);
    } on ApiException catch (e) {
      Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
    } catch (_) {
      Get.snackbar('Error', 'Failed to report review.',
          snackPosition: SnackPosition.BOTTOM);
    }
  }

  void clearReviews() {
    reviews.clear();
    averageRating.value = 0;
    totalCount.value = 0;
    currentPage.value = 1;
    totalPages.value = 1;
    hasUserReviewed.value = false;
    _currentProductId = '';
    _firstPageFetch = null;
    _inFlightProductId = null;
  }
}
