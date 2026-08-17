import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/auth_controller.dart';
import '../../controllers/cart_controller.dart';
import '../../controllers/product_controller.dart';
import '../../controllers/profile_controller.dart';
import '../../controllers/review_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/utils/color_utils.dart';
import '../../data/models/product_model.dart';
import '../../data/models/review_model.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  late final ProductController _productCtrl;
  late final CartController _cartCtrl;
  late final ReviewController _reviewCtrl;
  int _quantity = 1;
  String? _selectedSize;
  String? _selectedColor;

  @override
  void initState() {
    super.initState();
    _productCtrl = Get.find<ProductController>();
    _cartCtrl = Get.find<CartController>();
    // Tagged per-product and owned by this screen: a single shared
    // ReviewController let one product's in-flight loading/review state
    // bleed into whichever other product screen happened to be visible when
    // that request resolved. Deleted in dispose() below.
    _reviewCtrl = Get.put(ReviewController(), tag: widget.productId);
    _productCtrl.fetchProductDetail(widget.productId);
    _reviewCtrl.fetchProductReviews(widget.productId);
  }

  @override
  void dispose() {
    Get.delete<ReviewController>(tag: widget.productId);
    super.dispose();
  }

  /// A swatch circle for a real hex color, or a text pill for a legacy
  /// plain-name color (e.g. "Black") set before the admin's color field was
  /// a picker. Independently selectable from size, Daraz/Lazada-style,
  /// rather than one chip per size+color combination.
  Widget _buildColorOption(BuildContext context, ProductModel product, String color) {
    final selected = _selectedColor == color;
    final available = _selectedSize == null
        ? product.hasStockFor(color: color)
        : product.hasStockFor(size: _selectedSize, color: color);
    final swatch = tryParseHexColor(color);

    // No need to reconcile _selectedSize here: it can only ever hold a size
    // that's compatible with the color being selected, since incompatible
    // size options are already disabled below based on the color that's
    // about to become current.
    void select() => setState(() {
          _selectedColor = selected ? null : color;
          _quantity = 1;
        });

    if (swatch != null) {
      return GestureDetector(
        onTap: available ? select : null,
        child: Opacity(
          opacity: available ? 1 : 0.3,
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: swatch,
              shape: BoxShape.circle,
              border: Border.all(
                color: selected ? AppColors.primary : context.borderColor,
                width: selected ? 3 : 1,
              ),
            ),
          ),
        ),
      );
    }

    return GestureDetector(
      onTap: available ? select : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : context.pageBackground,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color: selected ? AppColors.primary : context.borderColor),
        ),
        child: Text(
          color,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            fontFamily: 'Inter',
            decoration: available ? null : TextDecoration.lineThrough,
            color: !available
                ? context.textSecondary
                : (selected ? AppColors.white : context.textPrimary),
          ),
        ),
      ),
    );
  }

  Widget _buildSizeOption(BuildContext context, ProductModel product, String size) {
    final selected = _selectedSize == size;
    final available = _selectedColor == null
        ? product.hasStockFor(size: size)
        : product.hasStockFor(size: size, color: _selectedColor);

    return GestureDetector(
      // Same reasoning as _buildColorOption: an incompatible size is already
      // disabled given the currently selected color, so selecting one here
      // can't leave _selectedColor pointing at an invalid combination.
      onTap: available
          ? () => setState(() {
                _selectedSize = selected ? null : size;
                _quantity = 1;
              })
          : null,
      child: Container(
        constraints: const BoxConstraints(minWidth: 44),
        height: 40,
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : context.pageBackground,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color: selected ? AppColors.primary : context.borderColor),
        ),
        child: Text(
          size,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            fontFamily: 'Inter',
            decoration: available ? null : TextDecoration.lineThrough,
            color: !available
                ? context.textSecondary
                : (selected ? AppColors.white : context.textPrimary),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        iconTheme: const IconThemeData(color: AppColors.white),
        title: const Text(
          'Product Detail',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
            fontSize: 20,
          ),
        ),
        actions: [
          if (Get.find<AuthController>().isLoggedIn)
            Obx(() {
              final product = _productCtrl.selectedProduct.value;
              if (product == null) return const SizedBox.shrink();
              final wishlisted = Get.find<ProfileController>().isWishlisted(product.id);
              return IconButton(
                onPressed: () => Get.find<ProfileController>().toggleWishlist(product),
                icon: Icon(
                  wishlisted ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                  color: AppColors.white,
                ),
              );
            }),
        ],
      ),
      body: Obx(() {
        if (_productCtrl.isLoadingDetail.value) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          );
        }

        if (_productCtrl.errorMessage.value.isNotEmpty &&
            _productCtrl.selectedProduct.value == null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline_rounded,
                    color: AppColors.danger, size: 48),
                const SizedBox(height: 12),
                Text(
                  _productCtrl.errorMessage.value,
                  style: TextStyle(
                    fontSize: 14,
                    color: context.textSecondary,
                    fontFamily: 'Inter',
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () =>
                      _productCtrl.fetchProductDetail(widget.productId),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('Retry',
                      style: TextStyle(
                          color: AppColors.white, fontFamily: 'Inter')),
                ),
              ],
            ),
          );
        }

        final product = _productCtrl.selectedProduct.value;
        if (product == null) return const SizedBox.shrink();

        final hasVariants = product.variants.isNotEmpty;
        final sizes = product.variantSizes;
        final colors = product.variantColors;
        final needsSize = sizes.isNotEmpty;
        final needsColor = colors.isNotEmpty;
        final selectionComplete =
            (!needsSize || _selectedSize != null) && (!needsColor || _selectedColor != null);
        final matchedVariant = selectionComplete
            ? product.findVariant(
                size: needsSize ? _selectedSize : null,
                color: needsColor ? _selectedColor : null,
              )
            : null;
        final effectivePrice = matchedVariant?.priceOverride ?? product.price;
        final effectiveStock = hasVariants ? (matchedVariant?.stock ?? 0) : product.stock;

        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ProductImageGallery(images: product.images),
              Container(
                color: context.surfaceColor,
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (product.categoryName.isNotEmpty)
                      Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: context.primaryTintBackground,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          product.categoryName,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: context.onPrimaryTintBackground,
                            fontFamily: 'Inter',
                          ),
                        ),
                      ),
                    Text(
                      product.name,
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: context.textPrimary,
                        fontFamily: 'Inter',
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Text(
                          '\$${effectivePrice.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                            fontFamily: 'Inter',
                          ),
                        ),
                        const Spacer(),
                        _StockBadge(stock: effectiveStock),
                      ],
                    ),
                    if (product.averageRating > 0) ...[
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          _StarRow(rating: product.averageRating),
                          const SizedBox(width: 8),
                          Text(
                            '${product.averageRating.toStringAsFixed(1)} (${product.reviewCount} reviews)',
                            style: TextStyle(
                              fontSize: 13,
                              color: context.textSecondary,
                              fontFamily: 'Inter',
                            ),
                          ),
                        ],
                      ),
                    ],
                    if (needsColor) ...[
                      const SizedBox(height: 16),
                      Text(
                        'Color${_selectedColor != null && tryParseHexColor(_selectedColor) == null ? ": $_selectedColor" : ""}',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: context.textPrimary,
                          fontFamily: 'Inter',
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: colors
                            .map((c) => _buildColorOption(context, product, c))
                            .toList(),
                      ),
                    ],
                    if (needsSize) ...[
                      const SizedBox(height: 16),
                      Text(
                        'Size${_selectedSize != null ? ": $_selectedSize" : ""}',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: context.textPrimary,
                          fontFamily: 'Inter',
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: sizes
                            .map((s) => _buildSizeOption(context, product, s))
                            .toList(),
                      ),
                    ],
                    if (hasVariants && !selectionComplete) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Please select a ${[
                          if (needsColor && _selectedColor == null) 'color',
                          if (needsSize && _selectedSize == null) 'size',
                        ].join(' and ')}',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.danger,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (product.description.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  color: context.surfaceColor,
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Description',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: context.textPrimary,
                          fontFamily: 'Inter',
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        product.description,
                        style: TextStyle(
                          fontSize: 14,
                          color: context.textSecondary,
                          fontFamily: 'Inter',
                          height: 1.6,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 8),
              Container(
                color: context.surfaceColor,
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Quantity',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: context.textPrimary,
                        fontFamily: 'Inter',
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _QtyButton(
                          icon: Icons.remove_rounded,
                          onTap: _quantity > 1
                              ? () => setState(() => _quantity--)
                              : null,
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Text(
                            '$_quantity',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: context.textPrimary,
                              fontFamily: 'Inter',
                            ),
                          ),
                        ),
                        _QtyButton(
                          icon: Icons.add_rounded,
                          onTap: _quantity < effectiveStock
                              ? () => setState(() => _quantity++)
                              : null,
                        ),
                        const Spacer(),
                        Text(
                          '\$${(effectivePrice * _quantity).toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                            fontFamily: 'Inter',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: effectiveStock > 0 && selectionComplete
                            ? () => _cartCtrl.addItem(
                                  product.id,
                                  quantity: _quantity,
                                  variantId: matchedVariant?.id,
                                )
                            : null,
                        icon: const Icon(Icons.shopping_cart_outlined,
                            color: AppColors.white),
                        label: const Text(
                          'Add to Cart',
                          style: TextStyle(
                            color: AppColors.white,
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          disabledBackgroundColor: context.borderColor,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              _ReviewsPreviewSection(
                productId: widget.productId,
                productName: _productCtrl.selectedProduct.value?.name ?? '',
                reviewCtrl: _reviewCtrl,
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      }),
    );
  }
}

class _ProductImageGallery extends StatefulWidget {
  final List<String> images;
  const _ProductImageGallery({required this.images});

  @override
  State<_ProductImageGallery> createState() => _ProductImageGalleryState();
}

class _ProductImageGalleryState extends State<_ProductImageGallery> {
  final _controller = PageController();
  int _index = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.images.isEmpty) {
      return SizedBox(
        width: double.infinity,
        height: 300,
        child: _placeholder(context),
      );
    }

    return SizedBox(
      width: double.infinity,
      height: 300,
      child: Stack(
        children: [
          PageView.builder(
            controller: _controller,
            itemCount: widget.images.length,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (_, i) => Image.network(
              widget.images[i],
              fit: BoxFit.cover,
              width: double.infinity,
              errorBuilder: (_, _, _) => _placeholder(context),
            ),
          ),
          if (widget.images.length > 1)
            Positioned(
              bottom: 12,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(widget.images.length, (i) {
                  final active = i == _index;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: active ? 18 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: active
                          ? AppColors.white
                          : AppColors.white.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  );
                }),
              ),
            ),
        ],
      ),
    );
  }

  Widget _placeholder(BuildContext context) {
    return Container(
      color: context.primaryTintBackground,
      child: Center(
        child: Icon(Icons.checkroom_rounded,
            color: context.onPrimaryTintBackground, size: 80),
      ),
    );
  }
}

class _StockBadge extends StatelessWidget {
  final int stock;
  const _StockBadge({required this.stock});

  @override
  Widget build(BuildContext context) {
    final inStock = stock > 0;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: inStock
            ? AppColors.success.withValues(alpha: 0.12)
            : AppColors.danger.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        inStock ? 'In Stock ($stock)' : 'Out of Stock',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: inStock ? AppColors.success : AppColors.danger,
          fontFamily: 'Inter',
        ),
      ),
    );
  }
}

class _StarRow extends StatelessWidget {
  final double rating;
  const _StarRow({required this.rating});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(5, (i) {
        if (i < rating.floor()) {
          return const Icon(Icons.star_rounded,
              size: 18, color: AppColors.secondary);
        } else if (i < rating) {
          return const Icon(Icons.star_half_rounded,
              size: 18, color: AppColors.secondary);
        }
        return const Icon(Icons.star_outline_rounded,
            size: 18, color: AppColors.secondary);
      }),
    );
  }
}

class _ReviewsPreviewSection extends StatelessWidget {
  final String productId;
  final String productName;
  final ReviewController reviewCtrl;

  const _ReviewsPreviewSection({
    required this.productId,
    required this.productName,
    required this.reviewCtrl,
  });

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final reviews = reviewCtrl.reviews.take(2).toList();
      final average = reviewCtrl.averageRating.value;
      final total = reviewCtrl.totalCount.value;

      return Container(
        color: context.surfaceColor,
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Reviews',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: context.textPrimary,
                    fontFamily: 'Inter',
                  ),
                ),
                if (total > 0) ...[
                  const SizedBox(width: 8),
                  Text(
                    '(${average.toStringAsFixed(1)} · $total)',
                    style: TextStyle(
                      fontSize: 13,
                      color: context.textSecondary,
                      fontFamily: 'Inter',
                    ),
                  ),
                ],
                const Spacer(),
                GestureDetector(
                  onTap: () => Get.toNamed(
                    '/product-reviews',
                    arguments: {
                      'productId': productId,
                      'productName': productName,
                    },
                  ),
                  child: const Text(
                    'See all',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                      fontFamily: 'Inter',
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (reviewCtrl.isLoading.value)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: CircularProgressIndicator(
                      color: AppColors.primary, strokeWidth: 2),
                ),
              )
            else if (reviews.isEmpty)
              GestureDetector(
                onTap: () => Get.toNamed(
                  '/product-reviews',
                  arguments: {
                    'productId': productId,
                    'productName': productName,
                  },
                ),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text(
                    'No reviews yet — be the first to review!',
                    style: TextStyle(
                      fontSize: 13,
                      color: context.textSecondary,
                      fontFamily: 'Inter',
                    ),
                  ),
                ),
              )
            else
              ...reviews.map((r) => _MiniReviewTile(review: r)),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Get.toNamed(
                  '/product-reviews',
                  arguments: {
                    'productId': productId,
                    'productName': productName,
                  },
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text(
                  'View All Reviews',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    });
  }
}

class _MiniReviewTile extends StatelessWidget {
  final ReviewModel review;
  const _MiniReviewTile({required this.review});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 14,
                backgroundColor: context.primaryTintBackground,
                child: Text(
                  review.userName.isNotEmpty
                      ? review.userName[0].toUpperCase()
                      : '?',
                  style: TextStyle(
                    color: context.onPrimaryTintBackground,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Inter',
                    fontSize: 11,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                review.userName,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: context.textPrimary,
                  fontFamily: 'Inter',
                ),
              ),
              const SizedBox(width: 8),
              Row(
                children: List.generate(
                  5,
                  (i) => Icon(
                    i < review.rating
                        ? Icons.star_rounded
                        : Icons.star_outline_rounded,
                    size: 13,
                    color: AppColors.secondary,
                  ),
                ),
              ),
            ],
          ),
          if (review.text.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              review.text,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 12,
                color: context.textSecondary,
                fontFamily: 'Inter',
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _QtyButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;

  const _QtyButton({required this.icon, this.onTap});

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: enabled
              ? context.primaryTintBackground
              : context.pageBackground,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: enabled ? AppColors.primary : context.borderColor,
            width: 1,
          ),
        ),
        child: Icon(
          icon,
          size: 18,
          color: enabled ? context.onPrimaryTintBackground : context.borderColor,
        ),
      ),
    );
  }
}
