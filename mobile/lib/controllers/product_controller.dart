import 'package:get/get.dart';
import '../core/constants/api_constants.dart';
import '../data/models/product_model.dart';
import '../services/api_service.dart';

class ProductController extends GetxController {
  final RxList<ProductModel> products = <ProductModel>[].obs;
  final Rx<ProductModel?> selectedProduct = Rx<ProductModel?>(null);
  final RxBool isLoading = false.obs;
  final RxBool isLoadingMore = false.obs;
  final RxBool isLoadingDetail = false.obs;
  final RxString selectedCategoryId = ''.obs;
  final RxString searchQuery = ''.obs;
  final RxInt currentPage = 1.obs;
  final RxInt totalPages = 1.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    fetchProducts(reset: true);
  }

  Future<void> fetchProducts({bool reset = false}) async {
    if (reset) {
      currentPage.value = 1;
      errorMessage.value = '';
    }
    if (isLoading.value || isLoadingMore.value) return;

    if (currentPage.value == 1) {
      isLoading.value = true;
    } else {
      isLoadingMore.value = true;
    }

    try {
      final params = <String, String>{
        'page': currentPage.value.toString(),
        'limit': '20',
      };
      if (selectedCategoryId.value.isNotEmpty) {
        params['category'] = selectedCategoryId.value;
      }
      if (searchQuery.value.isNotEmpty) {
        params['search'] = searchQuery.value;
      }

      final query = params.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
          .join('&');
      final data = await ApiService.get('${ApiConstants.products}?$query');

      final list = data['products'] as List<dynamic>;
      final fetched = list
          .map((e) => ProductModel.fromJson(e as Map<String, dynamic>))
          .toList();

      if (reset) {
        products.value = fetched;
      } else {
        products.addAll(fetched);
      }

      totalPages.value = data['pages'] as int? ?? 1;
    } on ApiException catch (e) {
      errorMessage.value = e.message;
    } catch (_) {
      errorMessage.value = 'Failed to load products.';
    } finally {
      isLoading.value = false;
      isLoadingMore.value = false;
    }
  }

  void filterByCategory(String categoryId) {
    if (selectedCategoryId.value == categoryId) return;
    selectedCategoryId.value = categoryId;
    fetchProducts(reset: true);
  }

  void search(String query) {
    searchQuery.value = query;
    fetchProducts(reset: true);
  }

  void clearSearch() {
    searchQuery.value = '';
    fetchProducts(reset: true);
  }

  bool get hasMore => currentPage.value < totalPages.value;

  void loadMore() {
    if (hasMore && !isLoadingMore.value && !isLoading.value) {
      currentPage.value++;
      fetchProducts();
    }
  }

  Future<void> fetchProductDetail(String productId) async {
    isLoadingDetail.value = true;
    selectedProduct.value = null;
    errorMessage.value = '';
    try {
      final data = await ApiService.get('${ApiConstants.products}/$productId');
      selectedProduct.value =
          ProductModel.fromJson(data['product'] as Map<String, dynamic>);
    } on ApiException catch (e) {
      errorMessage.value = e.message;
    } catch (_) {
      errorMessage.value = 'Failed to load product details.';
    } finally {
      isLoadingDetail.value = false;
    }
  }
}
