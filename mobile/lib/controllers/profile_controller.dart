import 'package:get/get.dart';
import '../core/constants/api_constants.dart';
import '../data/models/address_model.dart';
import '../data/models/product_model.dart';
import '../data/models/user_model.dart';
import '../services/api_service.dart';
import 'auth_controller.dart';

class ProfileController extends GetxController {
  final RxList<AddressModel> addresses = <AddressModel>[].obs;
  final RxList<ProductModel> wishlist = <ProductModel>[].obs;
  final RxBool isLoading = false.obs;
  final RxString errorMessage = ''.obs;

  bool isWishlisted(String productId) => wishlist.any((p) => p.id == productId);

  Future<void> loadAddresses() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final data = await ApiService.get(ApiConstants.usersMeAddresses, withAuth: true);
      final list = (data['addresses'] as List<dynamic>? ?? [])
          .map((e) => AddressModel.fromJson(e as Map<String, dynamic>))
          .toList();
      addresses.assignAll(list);
    } on ApiException catch (e) {
      errorMessage.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> addAddress(AddressModel input) => _mutateAddresses(
        () => ApiService.post(ApiConstants.usersMeAddresses, input.toJson(), withAuth: true),
      );

  Future<bool> updateAddress(String id, AddressModel input) => _mutateAddresses(
        () => ApiService.patch('${ApiConstants.usersMeAddresses}/$id', input.toJson(), withAuth: true),
      );

  Future<bool> deleteAddress(String id) => _mutateAddresses(
        () => ApiService.delete('${ApiConstants.usersMeAddresses}/$id', withAuth: true),
      );

  Future<bool> _mutateAddresses(Future<Map<String, dynamic>> Function() call) async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final data = await call();
      final list = (data['addresses'] as List<dynamic>? ?? [])
          .map((e) => AddressModel.fromJson(e as Map<String, dynamic>))
          .toList();
      addresses.assignAll(list);
      return true;
    } on ApiException catch (e) {
      errorMessage.value = e.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> loadWishlist() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final data = await ApiService.get(ApiConstants.usersMeWishlist, withAuth: true);
      final list = (data['wishlist'] as List<dynamic>? ?? [])
          .map((e) => ProductModel.fromJson(e as Map<String, dynamic>))
          .toList();
      wishlist.assignAll(list);
    } on ApiException catch (e) {
      errorMessage.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> toggleWishlist(ProductModel product) async {
    final wasWishlisted = isWishlisted(product.id);
    // Optimistic update — a wishlist toggle should feel instant.
    if (wasWishlisted) {
      wishlist.removeWhere((p) => p.id == product.id);
    } else {
      wishlist.add(product);
    }
    try {
      if (wasWishlisted) {
        await ApiService.delete('${ApiConstants.usersMeWishlist}/${product.id}', withAuth: true);
      } else {
        await ApiService.post('${ApiConstants.usersMeWishlist}/${product.id}', {}, withAuth: true);
      }
    } on ApiException catch (e) {
      // Roll back on failure.
      if (wasWishlisted) {
        wishlist.add(product);
      } else {
        wishlist.removeWhere((p) => p.id == product.id);
      }
      errorMessage.value = e.message;
    }
  }

  Future<bool> updateProfile({String? name, String? email, String? phone}) async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final body = <String, dynamic>{};
      if (name != null) body['name'] = name;
      if (email != null) body['email'] = email;
      if (phone != null) body['phone'] = phone;
      final data = await ApiService.patch(ApiConstants.usersMe, body, withAuth: true);
      final updated = UserModel.fromJson(data['user'] as Map<String, dynamic>);
      Get.find<AuthController>().user.value = updated;
      return true;
    } on ApiException catch (e) {
      errorMessage.value = e.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> updateNotificationsEnabled(bool enabled) async {
    errorMessage.value = '';
    try {
      await ApiService.patch(
        ApiConstants.usersMeNotificationPreferences,
        {'enabled': enabled},
        withAuth: true,
      );
      final current = Get.find<AuthController>().user.value;
      if (current != null) {
        Get.find<AuthController>().user.value = UserModel(
          id: current.id,
          name: current.name,
          email: current.email,
          phone: current.phone,
          role: current.role,
          hasGoogleAccount: current.hasGoogleAccount,
          notificationsEnabled: enabled,
        );
      }
      return true;
    } on ApiException catch (e) {
      errorMessage.value = e.message;
      return false;
    }
  }

  Future<bool> deleteAccount() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      await ApiService.delete(ApiConstants.usersMe, withAuth: true);
      return true;
    } on ApiException catch (e) {
      errorMessage.value = e.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  void reset() {
    addresses.clear();
    wishlist.clear();
    errorMessage.value = '';
  }
}
