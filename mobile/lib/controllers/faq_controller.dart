import 'package:get/get.dart';
import '../core/constants/api_constants.dart';
import '../data/models/faq_model.dart';
import '../services/api_service.dart';

class FaqController extends GetxController {
  final RxList<FaqModel> faqs = <FaqModel>[].obs;
  final RxList<String> categories = <String>[].obs;
  final RxBool isLoading = false.obs;
  final RxString selectedCategory = ''.obs;
  final RxString errorMessage = ''.obs;

  // Guards against rapid category-chip taps: without this, an older request
  // that resolves after a newer one overwrites `faqs` with the wrong
  // category's results. Only the response matching the latest-issued
  // request is ever applied.
  int _requestId = 0;

  @override
  void onInit() {
    super.onInit();
    fetchFaqs();
    fetchCategories();
  }

  Future<void> fetchFaqs({String? category}) async {
    final requestId = ++_requestId;
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final url = category != null && category.isNotEmpty
          ? '${ApiConstants.faq}?category=${Uri.encodeComponent(category)}'
          : ApiConstants.faq;
      final data = await ApiService.get(url);
      if (requestId != _requestId) return;
      final raw = data['faqs'] as List<dynamic>? ?? [];
      faqs.value = raw.map((e) => FaqModel.fromJson(e as Map<String, dynamic>)).toList();
    } on ApiException catch (e) {
      if (requestId == _requestId) errorMessage.value = e.message;
    } catch (_) {
      if (requestId == _requestId) errorMessage.value = 'Failed to load FAQs.';
    } finally {
      if (requestId == _requestId) isLoading.value = false;
    }
  }

  Future<void> fetchCategories() async {
    try {
      final data = await ApiService.get('${ApiConstants.faq}/categories');
      final raw = data['categories'] as List<dynamic>? ?? [];
      categories.value = raw.map((e) => e.toString()).toList();
    } catch (_) {}
  }

  void filterByCategory(String category) {
    selectedCategory.value = category;
    fetchFaqs(category: category.isEmpty ? null : category);
  }
}
