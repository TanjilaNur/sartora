import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/category_controller.dart';
import '../../controllers/product_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../widgets/product_card.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key});

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();

  late final ProductController _productCtrl;
  late final CategoryController _categoryCtrl;

  @override
  void initState() {
    super.initState();
    _productCtrl = Get.find<ProductController>();
    _categoryCtrl = Get.find<CategoryController>();

    _scrollController.addListener(() {
      if (_scrollController.position.pixels >=
          _scrollController.position.maxScrollExtent - 200) {
        _productCtrl.loadMore();
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onSearch(String value) {
    _productCtrl.search(value.trim());
  }

  void _clearSearch() {
    _searchController.clear();
    _productCtrl.clearSearch();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: context.pageBackground,
      child: Column(
        children: [
          _buildSearchBar(),
          _buildCategoryChips(),
          Expanded(child: _buildProductGrid()),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
      child: TextField(
        controller: _searchController,
        onSubmitted: _onSearch,
        textInputAction: TextInputAction.search,
        style: TextStyle(
          fontFamily: 'Inter',
          fontSize: 14,
          color: context.textPrimary,
        ),
        decoration: InputDecoration(
          hintText: 'Search dresses…',
          hintStyle: TextStyle(
            fontFamily: 'Inter',
            fontSize: 14,
            color: context.textSecondary,
          ),
          filled: true,
          fillColor: context.surfaceColor,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide.none,
          ),
          prefixIcon: Icon(Icons.search_rounded,
              color: context.textSecondary, size: 20),
          suffixIcon: Obx(() => _productCtrl.searchQuery.value.isNotEmpty
              ? IconButton(
                  icon: Icon(Icons.close_rounded,
                      color: context.textSecondary, size: 18),
                  onPressed: _clearSearch,
                )
              : const SizedBox.shrink()),
        ),
      ),
    );
  }

  Widget _buildCategoryChips() {
    return Obx(() {
      if (_categoryCtrl.isLoading.value && _categoryCtrl.categories.isEmpty) {
        return const SizedBox(
          height: 52,
          child: Center(
            child: SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppColors.primary,
              ),
            ),
          ),
        );
      }

      final categories = _categoryCtrl.categories;
      if (categories.isEmpty) return const SizedBox(height: 8);

      return SizedBox(
        height: 52,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          itemCount: categories.length + 1,
          separatorBuilder: (_, _) => const SizedBox(width: 8),
          itemBuilder: (context, index) {
            if (index == 0) {
              return Obx(() => _CategoryChip(
                    label: 'All',
                    isSelected: _productCtrl.selectedCategoryId.value.isEmpty,
                    onTap: () => _productCtrl.filterByCategory(''),
                  ));
            }
            final cat = categories[index - 1];
            return Obx(() => _CategoryChip(
                  label: cat.name,
                  isSelected: _productCtrl.selectedCategoryId.value == cat.id,
                  onTap: () => _productCtrl.filterByCategory(cat.id),
                ));
          },
        ),
      );
    });
  }

  Widget _buildProductGrid() {
    return Obx(() {
      if (_productCtrl.isLoading.value) {
        return const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        );
      }

      if (_productCtrl.errorMessage.value.isNotEmpty) {
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
                onPressed: () => _productCtrl.fetchProducts(reset: true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Retry',
                    style: TextStyle(color: AppColors.white, fontFamily: 'Inter')),
              ),
            ],
          ),
        );
      }

      if (_productCtrl.products.isEmpty) {
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.search_off_rounded,
                  color: context.borderColor, size: 64),
              const SizedBox(height: 12),
              Text(
                'No products found',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: context.textSecondary,
                  fontFamily: 'Inter',
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Try a different category or search term.',
                style: TextStyle(
                  fontSize: 13,
                  color: context.textSecondary,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
        );
      }

      return RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () => _productCtrl.fetchProducts(reset: true),
        child: GridView.builder(
          controller: _scrollController,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 14,
            crossAxisSpacing: 14,
            childAspectRatio: 0.68,
          ),
          itemCount: _productCtrl.products.length +
              (_productCtrl.isLoadingMore.value ? 2 : 0),
          itemBuilder: (context, index) {
            if (index >= _productCtrl.products.length) {
              return const Center(
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: AppColors.primary),
                ),
              );
            }
            final product = _productCtrl.products[index];
            return ProductCard(
              product: product,
              onTap: () => Get.toNamed('/product/${product.id}'),
            );
          },
        ),
      );
    });
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : context.surfaceColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : context.borderColor,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
            color: isSelected ? AppColors.white : context.textSecondary,
            fontFamily: 'Inter',
          ),
        ),
      ),
    );
  }
}
