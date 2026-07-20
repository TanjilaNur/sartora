import 'package:get/get.dart';
import '../core/constants/api_constants.dart';
import '../data/models/category_model.dart';
import '../services/api_service.dart';

class CategoryController extends GetxController {
  final RxList<CategoryModel> categories = <CategoryModel>[].obs;
  final RxBool isLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    fetchCategories();
  }

  Future<void> fetchCategories() async {
    isLoading.value = true;
    try {
      final data = await ApiService.get(ApiConstants.categories);
      final list = data['categories'] as List<dynamic>;
      categories.value = list
          .map((e) => CategoryModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
    } finally {
      isLoading.value = false;
    }
  }
}
