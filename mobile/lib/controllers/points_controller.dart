import 'package:get/get.dart';
import '../core/constants/api_constants.dart';
import '../data/models/points_ledger_model.dart';
import '../data/models/badge_model.dart';
import '../services/api_service.dart';

class PointsController extends GetxController {
  final RxBool isLoading = false.obs;
  final RxString errorMessage = ''.obs;
  final RxInt balance = 0.obs;
  final RxList<PointsLedgerModel> history = <PointsLedgerModel>[].obs;
  final RxInt currentPage = 1.obs;
  final RxInt totalPages = 1.obs;

  final RxList<EarnedBadge> earnedBadges = <EarnedBadge>[].obs;
  final RxList<BadgeModel> lockedBadges = <BadgeModel>[].obs;
  final RxBool badgesLoading = false.obs;
  final RxString badgesError = ''.obs;

  final RxList<LeaderboardEntry> leaderboard = <LeaderboardEntry>[].obs;
  final Rx<Map<String, dynamic>?> myRank = Rx<Map<String, dynamic>?>(null);
  final RxBool leaderboardLoading = false.obs;
  final RxString leaderboardError = ''.obs;

  @override
  void onInit() {
    super.onInit();
    fetchPoints();
    fetchBadges();
    fetchLeaderboard();
  }

  /// Points/badges/leaderboard are fetched once at app boot, before a user is
  /// necessarily logged in, so they come back empty for a fresh session.
  /// Call this after login/register/session-restore so the data is current.
  void refreshAll() {
    fetchPoints();
    fetchBadges();
    fetchLeaderboard();
  }

  /// Clears state so a freshly-logged-in user never briefly sees the
  /// previous account's balance/badges/history while the refetch is in flight.
  void reset() {
    balance.value = 0;
    history.clear();
    currentPage.value = 1;
    totalPages.value = 1;
    earnedBadges.clear();
    lockedBadges.clear();
    leaderboard.clear();
    myRank.value = null;
  }

  Future<void> fetchPoints({int page = 1}) async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final data = await ApiService.get(
        '${ApiConstants.points}/me?page=$page&limit=20',
        withAuth: true,
      );
      balance.value = (data['balance'] as num?)?.toInt() ?? 0;
      currentPage.value = (data['page'] as num?)?.toInt() ?? 1;
      totalPages.value = (data['pages'] as num?)?.toInt() ?? 1;
      final raw = data['entries'] as List<dynamic>? ?? [];
      final entries = raw
          .map((e) => PointsLedgerModel.fromJson(e as Map<String, dynamic>))
          .toList();
      if (page == 1) {
        history.value = entries;
      } else {
        history.addAll(entries);
      }
    } on ApiException catch (e) {
      errorMessage.value = e.message;
    } catch (_) {
      errorMessage.value = 'Failed to load points.';
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> fetchBadges() async {
    badgesLoading.value = true;
    badgesError.value = '';
    try {
      final data = await ApiService.get(
        '${ApiConstants.badges}/my',
        withAuth: true,
      );
      final earnedRaw = data['earned'] as List<dynamic>? ?? [];
      final lockedRaw = data['locked'] as List<dynamic>? ?? [];
      earnedBadges.value = earnedRaw
          .map((e) => EarnedBadge.fromJson(e as Map<String, dynamic>))
          .toList();
      lockedBadges.value = lockedRaw
          .map((e) {
            final badgeData = (e as Map<String, dynamic>)['badge'];
            return BadgeModel.fromJson(
                badgeData is Map<String, dynamic> ? badgeData : {});
          })
          .toList();
    } on ApiException catch (e) {
      badgesError.value = e.message;
    } catch (_) {
      badgesError.value = 'Failed to load badges.';
    } finally {
      badgesLoading.value = false;
    }
  }

  Future<void> fetchLeaderboard() async {
    leaderboardLoading.value = true;
    leaderboardError.value = '';
    try {
      final data = await ApiService.get(
        '${ApiConstants.points}/leaderboard?limit=20',
        withAuth: true,
      );
      final raw = data['leaderboard'] as List<dynamic>? ?? [];
      leaderboard.value = raw
          .map((e) => LeaderboardEntry.fromJson(e as Map<String, dynamic>))
          .toList();
      myRank.value = data['myRank'] as Map<String, dynamic>?;
    } on ApiException catch (e) {
      leaderboardError.value = e.message;
    } catch (_) {
      leaderboardError.value = 'Failed to load leaderboard.';
    } finally {
      leaderboardLoading.value = false;
    }
  }

  Future<void> loadMoreHistory() async {
    if (isLoading.value) return;
    if (currentPage.value >= totalPages.value) return;
    await fetchPoints(page: currentPage.value + 1);
  }
}
