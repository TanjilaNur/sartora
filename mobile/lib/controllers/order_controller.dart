import 'package:get/get.dart';
import '../core/constants/api_constants.dart';
import '../data/models/order_model.dart';
import '../data/models/refund_model.dart';
import '../data/models/invoice_model.dart';
import '../services/api_service.dart';
import 'cart_controller.dart';

class OrderController extends GetxController {
  final RxList<OrderModel> orders = <OrderModel>[].obs;
  final RxBool isLoading = false.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    fetchOrders();
  }

  Future<void> fetchOrders() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final data = await ApiService.get(ApiConstants.orders, withAuth: true);
      final raw = data['orders'] as List<dynamic>? ?? [];
      orders.value = raw
          .map((e) => OrderModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on ApiException catch (e) {
      errorMessage.value = e.message;
    } catch (_) {
      errorMessage.value = 'Failed to load orders.';
    } finally {
      isLoading.value = false;
    }
  }

  Future<OrderModel?> fetchOrderById(String orderId) async {
    try {
      final data = await ApiService.get(
        '${ApiConstants.orders}/$orderId',
        withAuth: true,
      );
      return OrderModel.fromJson(data['order'] as Map<String, dynamic>);
    } on ApiException catch (e) {
      Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
      return null;
    } catch (_) {
      Get.snackbar('Error', 'Failed to load order.',
          snackPosition: SnackPosition.BOTTOM);
      return null;
    }
  }

  Future<bool> cancelOrder(String orderId) async {
    try {
      await ApiService.post(
        '${ApiConstants.orders}/$orderId/cancel',
        {},
        withAuth: true,
      );
      await fetchOrders();
      Get.snackbar('Order Cancelled', 'Your order has been cancelled.',
          snackPosition: SnackPosition.BOTTOM);
      return true;
    } on ApiException catch (e) {
      Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
      return false;
    } catch (_) {
      Get.snackbar('Error', 'Failed to cancel order.',
          snackPosition: SnackPosition.BOTTOM);
      return false;
    }
  }

  Future<InvoiceModel?> fetchInvoice(String orderId) async {
    try {
      final data = await ApiService.get(
        '${ApiConstants.orders}/$orderId/invoice',
        withAuth: true,
      );
      return InvoiceModel.fromJson(data['invoice'] as Map<String, dynamic>);
    } on ApiException catch (e) {
      Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
      return null;
    } catch (_) {
      Get.snackbar('Error', 'Failed to load invoice.',
          snackPosition: SnackPosition.BOTTOM);
      return null;
    }
  }

  Future<RefundModel?> requestRefund(String orderId, String reason) async {
    try {
      final data = await ApiService.post(
        '${ApiConstants.refunds}/$orderId',
        {'reason': reason},
        withAuth: true,
      );
      await fetchOrders();
      Get.snackbar('Refund Requested',
          'Your refund request has been submitted.',
          snackPosition: SnackPosition.BOTTOM);
      return RefundModel.fromJson(data['refund'] as Map<String, dynamic>);
    } on ApiException catch (e) {
      Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
      return null;
    } catch (_) {
      Get.snackbar('Error', 'Failed to submit refund request.',
          snackPosition: SnackPosition.BOTTOM);
      return null;
    }
  }

  /// Adds every item from a past order back into the current cart. Items
  /// whose product/variant no longer exists or is out of stock are skipped
  /// rather than failing the whole reorder — the summary tells the user
  /// exactly what didn't make it back in.
  Future<void> reorder(OrderModel order) async {
    final cartCtrl = Get.find<CartController>();
    var succeeded = 0;
    var failed = 0;

    for (final item in order.items) {
      if (item.productId == null) {
        failed++;
        continue;
      }
      final ok = await cartCtrl.addItem(
        item.productId!,
        quantity: item.quantity,
        variantId: item.variantId,
        silent: true,
      );
      if (ok) {
        succeeded++;
      } else {
        failed++;
      }
    }

    if (succeeded > 0 && failed == 0) {
      Get.snackbar('Added to Cart', '$succeeded item${succeeded == 1 ? '' : 's'} added from this order.',
          snackPosition: SnackPosition.BOTTOM);
    } else if (succeeded > 0 && failed > 0) {
      Get.snackbar('Partially Added',
          '$succeeded item${succeeded == 1 ? '' : 's'} added — $failed item${failed == 1 ? '' : 's'} no longer available.',
          snackPosition: SnackPosition.BOTTOM);
    } else {
      Get.snackbar('Could Not Reorder', 'None of these items are available anymore.', snackPosition: SnackPosition.BOTTOM);
    }
  }

  Future<RefundModel?> fetchRefundStatus(String orderId) async {
    try {
      final data = await ApiService.get(
        '${ApiConstants.refunds}/my/$orderId',
        withAuth: true,
      );
      return RefundModel.fromJson(data['refund'] as Map<String, dynamic>);
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
      return null;
    } catch (_) {
      return null;
    }
  }
}
