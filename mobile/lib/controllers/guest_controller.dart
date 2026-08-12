import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../core/constants/api_constants.dart';
import '../core/utils/color_utils.dart';
import '../services/api_service.dart';

class GuestCartItemVariant {
  final String id;
  final String? size;
  final String? color;

  const GuestCartItemVariant({required this.id, this.size, this.color});

  Color? get swatchColor => tryParseHexColor(color);

  String get label {
    final hasSize = size != null && size!.isNotEmpty;
    final hasColorText = color != null && color!.isNotEmpty && swatchColor == null;
    if (hasSize && hasColorText) return '$size / $color';
    if (hasSize) return size!;
    if (hasColorText) return color!;
    return '';
  }

  static GuestCartItemVariant? tryFromJson(dynamic json) {
    if (json is! Map<String, dynamic>) return null;
    final id = (json['id'] ?? json['_id']) as String?;
    if (id == null) return null;
    return GuestCartItemVariant(id: id, size: json['size'] as String?, color: json['color'] as String?);
  }
}

class GuestCartItem {
  final String productId;
  final GuestCartItemVariant? variant;
  final String name;
  final double price;
  final String? imageUrl;
  final int quantity;
  final double subtotal;

  GuestCartItem({
    required this.productId,
    this.variant,
    required this.name,
    required this.price,
    this.imageUrl,
    required this.quantity,
    required this.subtotal,
  });

  factory GuestCartItem.fromJson(Map<String, dynamic> json) {
    final product = json['product'] as Map<String, dynamic>? ?? {};
    final images = product['images'] as List<dynamic>? ?? [];
    return GuestCartItem(
      productId: json['productId'] as String? ?? '',
      variant: GuestCartItemVariant.tryFromJson(json['variant']),
      name: product['name'] as String? ?? 'Unknown Product',
      price: (product['price'] as num?)?.toDouble() ?? 0.0,
      imageUrl: images.isNotEmpty ? images.first as String : null,
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class GuestController extends GetxController {
  final RxString guestId = ''.obs;
  final RxBool isGuestMode = false.obs;
  final RxList<GuestCartItem> cartItems = <GuestCartItem>[].obs;
  final RxDouble cartTotal = 0.0.obs;
  final RxBool isLoading = false.obs;
  final RxString errorMessage = ''.obs;

  int get itemCount => cartItems.fold(0, (sum, i) => sum + i.quantity);

  @override
  void onInit() {
    super.onInit();
    _restoreGuestId();
  }

  Future<void> _restoreGuestId() async {
    final stored = await ApiService.getGuestId();
    if (stored != null) {
      guestId.value = stored;
      isGuestMode.value = true;
    }
  }

  Future<void> startGuestSession() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final data = await ApiService.post(ApiConstants.guestSession, {});
      final id = data['guestId'] as String;
      await ApiService.saveGuestId(id);
      guestId.value = id;
      isGuestMode.value = true;
      Get.offAllNamed('/guest-home');
    } on ApiException catch (e) {
      errorMessage.value = e.message;
    } catch (_) {
      errorMessage.value = 'Failed to start guest session.';
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> fetchGuestCart() async {
    if (guestId.isEmpty) return;
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final data = await ApiService.get(
        '${ApiConstants.guestCart}/${guestId.value}',
      );
      _updateFromCart(data['cart'] as Map<String, dynamic>);
    } on ApiException catch (e) {
      errorMessage.value = e.message;
    } catch (_) {
      errorMessage.value = 'Failed to load guest cart.';
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> addToGuestCart(String productId, {int quantity = 1, String? variantId}) async {
    if (guestId.isEmpty) return;
    try {
      final data = await ApiService.post(
        '${ApiConstants.guestCart}/${guestId.value}/items',
        {'productId': productId, 'quantity': quantity, 'variantId': ?variantId},
      );
      _updateFromCart(data['cart'] as Map<String, dynamic>);
      Get.snackbar(
        'Added to Cart',
        'Item added to your guest cart',
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 2),
      );
    } on ApiException catch (e) {
      Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
    } catch (_) {
      Get.snackbar('Error', 'Failed to add item to cart',
          snackPosition: SnackPosition.BOTTOM);
    }
  }

  Future<void> updateGuestCartItem(String productId, int quantity, {String? variantId}) async {
    if (quantity < 1) {
      await removeFromGuestCart(productId, variantId: variantId);
      return;
    }
    try {
      final data = await ApiService.put(
        '${ApiConstants.guestCart}/${guestId.value}/items/$productId',
        {'quantity': quantity, 'variantId': ?variantId},
      );
      _updateFromCart(data['cart'] as Map<String, dynamic>);
    } on ApiException catch (e) {
      Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
    } catch (_) {
      Get.snackbar('Error', 'Failed to update item',
          snackPosition: SnackPosition.BOTTOM);
    }
  }

  Future<void> removeFromGuestCart(String productId, {String? variantId}) async {
    try {
      final query = variantId != null ? '?variantId=$variantId' : '';
      final data = await ApiService.delete(
        '${ApiConstants.guestCart}/${guestId.value}/items/$productId$query',
      );
      _updateFromCart(data['cart'] as Map<String, dynamic>);
    } on ApiException catch (e) {
      Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
    } catch (_) {
      Get.snackbar('Error', 'Failed to remove item',
          snackPosition: SnackPosition.BOTTOM);
    }
  }

  void _updateFromCart(Map<String, dynamic> cart) {
    final items = (cart['items'] as List)
        .map((i) => GuestCartItem.fromJson(i as Map<String, dynamic>))
        .toList();
    cartItems.value = items;
    cartTotal.value = (cart['total'] as num?)?.toDouble() ?? 0.0;
  }

  Future<void> mergeCartIntoUser() async {
    if (guestId.isEmpty) return;
    try {
      await ApiService.post(
        '${ApiConstants.guestCart}/${guestId.value}/merge',
        {},
        withAuth: true,
      );
    } catch (_) {}
    await exitGuestMode();
  }

  Future<void> exitGuestMode() async {
    await ApiService.clearGuestId();
    guestId.value = '';
    isGuestMode.value = false;
    cartItems.clear();
    cartTotal.value = 0.0;
  }
}
