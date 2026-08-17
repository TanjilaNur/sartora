import 'package:get/get.dart';
import '../core/constants/api_constants.dart';
import '../controllers/guest_controller.dart';
import '../data/models/cart_model.dart';
import '../data/models/order_model.dart';
import '../services/api_service.dart';

class CartController extends GetxController {
  final Rx<CartModel?> cart = Rx<CartModel?>(null);
  final RxBool isLoading = false.obs;
  final RxBool isSubmitting = false.obs;
  final RxString errorMessage = ''.obs;

  int get itemCount => cart.value?.itemCount ?? 0;
  double get total => cart.value?.total ?? 0.0;

  @override
  void onInit() {
    super.onInit();
    _initCart();
  }

  Future<void> _initCart() async {
    final token = await ApiService.getAccessToken();
    if (token != null) fetchCart();
  }

  Future<void> fetchCart() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final data = await ApiService.get(ApiConstants.cart, withAuth: true);
      cart.value = CartModel.fromJson(data['cart'] as Map<String, dynamic>);
    } on ApiException catch (e) {
      errorMessage.value = e.message;
    } catch (_) {
      errorMessage.value = 'Failed to load cart.';
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> addItem(String productId, {int quantity = 1, String? variantId, bool silent = false}) async {
    final guestCtrl = Get.find<GuestController>();
    if (guestCtrl.isGuestMode.value) {
      await guestCtrl.addToGuestCart(productId, quantity: quantity, variantId: variantId);
      return true;
    }
    try {
      final data = await ApiService.post(
        '${ApiConstants.cart}/$productId',
        {'quantity': quantity, 'variantId': ?variantId},
        withAuth: true,
      );
      cart.value = CartModel.fromJson(data['cart'] as Map<String, dynamic>);
      if (!silent) {
        Get.snackbar(
          'Added to Cart',
          'Item added to your cart',
          snackPosition: SnackPosition.BOTTOM,
          duration: const Duration(seconds: 2),
        );
      }
      return true;
    } on ApiException catch (e) {
      if (!silent) Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
      return false;
    } catch (_) {
      if (!silent) Get.snackbar('Error', 'Failed to add item to cart', snackPosition: SnackPosition.BOTTOM);
      return false;
    }
  }

  Future<void> updateItem(String productId, int quantity, {String? variantId}) async {
    if (quantity < 1) {
      await removeItem(productId, variantId: variantId);
      return;
    }
    try {
      final data = await ApiService.put(
        '${ApiConstants.cart}/$productId',
        {'quantity': quantity, 'variantId': ?variantId},
        withAuth: true,
      );
      cart.value = CartModel.fromJson(data['cart'] as Map<String, dynamic>);
    } on ApiException catch (e) {
      Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
    } catch (_) {
      Get.snackbar('Error', 'Failed to update item',
          snackPosition: SnackPosition.BOTTOM);
    }
  }

  Future<void> removeItem(String productId, {String? variantId}) async {
    try {
      final query = variantId != null ? '?variantId=$variantId' : '';
      final data = await ApiService.delete(
        '${ApiConstants.cart}/$productId$query',
        withAuth: true,
      );
      cart.value = CartModel.fromJson(data['cart'] as Map<String, dynamic>);
    } on ApiException catch (e) {
      Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
    } catch (_) {
      Get.snackbar('Error', 'Failed to remove item',
          snackPosition: SnackPosition.BOTTOM);
    }
  }

  Future<OrderModel?> checkout({
    required Map<String, String> address,
    required String paymentMethod,
    String? promoCode,
  }) async {
    isSubmitting.value = true;
    try {
      final data = await ApiService.post(
        ApiConstants.orders,
        {
          'address': address,
          'paymentDetails': {'method': paymentMethod},
          if (promoCode != null && promoCode.isNotEmpty) 'promoCode': promoCode,
        },
        withAuth: true,
      );
      final order = OrderModel.fromJson(data);
      fetchCart();
      return order;
    } on ApiException catch (e) {
      Get.snackbar('Order Failed', e.message,
          snackPosition: SnackPosition.BOTTOM);
      return null;
    } catch (_) {
      Get.snackbar('Order Failed', 'Could not place order. Please try again.',
          snackPosition: SnackPosition.BOTTOM);
      return null;
    } finally {
      isSubmitting.value = false;
    }
  }
}
