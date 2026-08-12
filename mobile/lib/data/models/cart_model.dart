import 'package:flutter/material.dart';
import '../../core/utils/color_utils.dart';

class CartItemVariant {
  final String id;
  final String? size;
  final String? color;

  const CartItemVariant({required this.id, this.size, this.color});

  Color? get swatchColor => tryParseHexColor(color);

  String get label {
    final hasSize = size != null && size!.isNotEmpty;
    final hasColorText = color != null && color!.isNotEmpty && swatchColor == null;
    if (hasSize && hasColorText) return '$size / $color';
    if (hasSize) return size!;
    if (hasColorText) return color!;
    return '';
  }

  static CartItemVariant? tryFromJson(dynamic json) {
    if (json is! Map<String, dynamic>) return null;
    final id = (json['id'] ?? json['_id']) as String?;
    if (id == null) return null;
    return CartItemVariant(id: id, size: json['size'] as String?, color: json['color'] as String?);
  }
}

class CartItemProductModel {
  final String id;
  final String name;
  final double price;
  final List<String> images;
  final int stock;

  const CartItemProductModel({
    required this.id,
    required this.name,
    required this.price,
    required this.images,
    required this.stock,
  });

  String get primaryImage => images.isNotEmpty ? images.first : '';

  factory CartItemProductModel.fromJson(Map<String, dynamic> json) {
    final rawImages = json['images'] as List<dynamic>? ?? [];
    return CartItemProductModel(
      id: (json['id'] ?? json['_id']) as String,
      name: json['name'] as String,
      price: (json['price'] as num).toDouble(),
      images: rawImages.map((e) => e as String).toList(),
      stock: json['stock'] as int? ?? 0,
    );
  }
}

class CartItemModel {
  final CartItemProductModel product;
  final CartItemVariant? variant;
  final int quantity;
  final double subtotal;

  const CartItemModel({
    required this.product,
    this.variant,
    required this.quantity,
    required this.subtotal,
  });

  /// Returns null if the item's product is missing (e.g. deleted from the
  /// catalog after being added to the cart) so the caller can drop it
  /// instead of crashing on a bad cast.
  static CartItemModel? tryFromJson(Map<String, dynamic> json) {
    final rawProduct = json['product'] as Map<String, dynamic>?;
    if (rawProduct == null) return null;
    return CartItemModel(
      product: CartItemProductModel.fromJson(rawProduct),
      variant: CartItemVariant.tryFromJson(json['variant']),
      quantity: json['quantity'] as int,
      subtotal: (json['subtotal'] as num).toDouble(),
    );
  }
}

class CartModel {
  final List<CartItemModel> items;
  final double total;

  const CartModel({required this.items, required this.total});

  factory CartModel.fromJson(Map<String, dynamic> json) {
    final raw = json['items'] as List<dynamic>? ?? [];
    final items = raw
        .map((e) => CartItemModel.tryFromJson(e as Map<String, dynamic>))
        .whereType<CartItemModel>()
        .toList();
    return CartModel(
      items: items,
      total: (json['total'] as num).toDouble(),
    );
  }

  int get itemCount => items.fold(0, (sum, item) => sum + item.quantity);
}
