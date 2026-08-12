import 'package:flutter/material.dart';
import '../../core/utils/color_utils.dart';

class ProductVariant {
  final String id;
  final String? size;
  final String? color;
  final int stock;
  final double? priceOverride;

  const ProductVariant({
    required this.id,
    this.size,
    this.color,
    required this.stock,
    this.priceOverride,
  });

  /// Null unless [color] is a real hex value (e.g. "#FF0000") set via the
  /// admin's color picker — a legacy plain name like "Black" falls back to
  /// showing as text via [label] instead of a dot.
  Color? get swatchColor => tryParseHexColor(color);

  /// A single combined label since a variant is one concrete combination
  /// (e.g. "S / Black"), not independently selectable size and color axes.
  /// A hex color is represented by [swatchColor] instead, so it's excluded
  /// here rather than printed as a raw "#FF0000" string.
  String get label {
    final hasSize = size != null && size!.isNotEmpty;
    final hasColorText = color != null && color!.isNotEmpty && swatchColor == null;
    if (hasSize && hasColorText) return '$size / $color';
    if (hasSize) return size!;
    if (hasColorText) return color!;
    return '';
  }

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    return ProductVariant(
      id: (json['id'] ?? json['_id']) as String,
      size: json['size'] as String?,
      color: json['color'] as String?,
      stock: (json['stock'] as num?)?.toInt() ?? 0,
      priceOverride: (json['priceOverride'] as num?)?.toDouble(),
    );
  }
}

class ProductModel {
  final String id;
  final String name;
  final String description;
  final String categoryId;
  final String categoryName;
  final double price;
  final int stock;
  final List<String> images;
  final List<ProductVariant> variants;
  final double averageRating;
  final int reviewCount;

  const ProductModel({
    required this.id,
    required this.name,
    required this.description,
    required this.categoryId,
    required this.categoryName,
    required this.price,
    required this.stock,
    required this.images,
    required this.variants,
    required this.averageRating,
    required this.reviewCount,
  });

  String get primaryImage => images.isNotEmpty ? images.first : '';

  /// Distinct sizes across all variants, in the order the admin entered
  /// them — shown as an independently selectable row, Daraz/Lazada-style,
  /// rather than one chip per size+color combination.
  List<String> get variantSizes {
    final seen = <String>{};
    final result = <String>[];
    for (final v in variants) {
      if (v.size != null && v.size!.isNotEmpty && seen.add(v.size!)) {
        result.add(v.size!);
      }
    }
    return result;
  }

  /// Distinct colors across all variants, in entry order — a separate
  /// selectable row from [variantSizes], same reasoning.
  List<String> get variantColors {
    final seen = <String>{};
    final result = <String>[];
    for (final v in variants) {
      if (v.color != null && v.color!.isNotEmpty && seen.add(v.color!)) {
        result.add(v.color!);
      }
    }
    return result;
  }

  /// The concrete variant for a given size/color pick, if any — variants
  /// are a sparse list (not every combination need exist), so this can
  /// legitimately return null while the user is still mid-selection.
  ProductVariant? findVariant({String? size, String? color}) {
    for (final v in variants) {
      final sizeOk = size == null || v.size == size;
      final colorOk = color == null || v.color == color;
      if (sizeOk && colorOk) return v;
    }
    return null;
  }

  /// Whether any in-stock variant matches the given (possibly partial)
  /// size/color pick — used to greyed out the OTHER axis's options that
  /// have no stock in combination with what's already selected.
  bool hasStockFor({String? size, String? color}) {
    return variants.any((v) {
      final sizeOk = size == null || v.size == size;
      final colorOk = color == null || v.color == color;
      return sizeOk && colorOk && v.stock > 0;
    });
  }

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    String categoryId = '';
    String categoryName = '';
    final cat = json['category'];
    if (cat is Map<String, dynamic>) {
      categoryId = (cat['id'] ?? cat['_id']) as String? ?? '';
      categoryName = cat['name'] as String? ?? '';
    } else if (cat is String) {
      categoryId = cat;
    }

    final rawImages = json['images'] as List<dynamic>? ?? [];
    final rawVariants = json['variants'] as List<dynamic>? ?? [];

    return ProductModel(
      id: (json['id'] ?? json['_id']) as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      categoryId: categoryId,
      categoryName: categoryName,
      price: (json['price'] as num).toDouble(),
      stock: json['stock'] as int? ?? 0,
      images: rawImages.map((e) => e as String).toList(),
      variants: rawVariants
          .map((e) => ProductVariant.fromJson(e as Map<String, dynamic>))
          .toList(),
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0.0,
      reviewCount: json['reviewCount'] as int? ?? 0,
    );
  }
}
