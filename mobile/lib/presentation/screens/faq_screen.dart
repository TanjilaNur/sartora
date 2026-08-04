import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/faq_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../../data/models/faq_model.dart';

class FaqScreen extends StatelessWidget {
  const FaqScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ctrl = Get.find<FaqController>();

    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        iconTheme: const IconThemeData(color: AppColors.white),
        title: const Text(
          'FAQ',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
            fontSize: 20,
          ),
        ),
      ),
      body: Column(
        children: [
          Obx(() {
            if (ctrl.categories.isEmpty) return const SizedBox.shrink();
            return _CategoryChips(
              categories: ctrl.categories,
              selected: ctrl.selectedCategory.value,
              onSelect: ctrl.filterByCategory,
            );
          }),
          Expanded(
            child: Obx(() {
              if (ctrl.isLoading.value) {
                return const Center(
                    child: CircularProgressIndicator(color: AppColors.primary));
              }
              if (ctrl.faqs.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.help_outline_rounded,
                          size: 64, color: context.borderColor),
                      const SizedBox(height: 16),
                      Text(
                        'No FAQs available',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: context.textSecondary,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ],
                  ),
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: ctrl.faqs.length,
                itemBuilder: (_, i) => _FaqTile(faq: ctrl.faqs[i]),
              );
            }),
          ),
        ],
      ),
    );
  }
}

class _CategoryChips extends StatelessWidget {
  final List<String> categories;
  final String selected;
  final ValueChanged<String> onSelect;

  const _CategoryChips({
    required this.categories,
    required this.selected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: context.surfaceColor,
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _chip(context, 'All', selected, onSelect),
            ...categories.map((c) => _chip(context, c, selected, onSelect)),
          ],
        ),
      ),
    );
  }

  Widget _chip(BuildContext context, String label, String selected,
      ValueChanged<String> onSelect) {
    final isSelected = label == 'All' ? selected.isEmpty : selected == label;
    final value = label == 'All' ? '' : label;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(
          label,
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: isSelected ? AppColors.white : context.textSecondary,
          ),
        ),
        selected: isSelected,
        selectedColor: AppColors.primary,
        backgroundColor: context.pageBackground,
        side: BorderSide(
          color: isSelected ? AppColors.primary : context.borderColor,
        ),
        onSelected: (_) => onSelect(value),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }
}

class _FaqTile extends StatefulWidget {
  final FaqModel faq;
  const _FaqTile({required this.faq});

  @override
  State<_FaqTile> createState() => _FaqTileState();
}

class _FaqTileState extends State<_FaqTile> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: context.surfaceColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 4,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: ExpansionTile(
          initiallyExpanded: false,
          onExpansionChanged: (v) => setState(() => _expanded = v),
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          childrenPadding:
              const EdgeInsets.only(left: 16, right: 16, bottom: 16),
          expandedCrossAxisAlignment: CrossAxisAlignment.start,
          leading: Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: context.primaryTintBackground,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(Icons.help_outline_rounded,
                size: 18, color: context.onPrimaryTintBackground),
          ),
          title: Text(
            widget.faq.question,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              fontFamily: 'Inter',
              color: _expanded ? AppColors.primary : context.textPrimary,
            ),
          ),
          trailing: Icon(
            _expanded
                ? Icons.keyboard_arrow_up_rounded
                : Icons.keyboard_arrow_down_rounded,
            color: AppColors.primary,
          ),
          children: [
            Divider(color: context.borderColor, height: 1),
            const SizedBox(height: 12),
            Text(
              widget.faq.answer,
              style: TextStyle(
                fontSize: 13,
                color: context.textSecondary,
                fontFamily: 'Inter',
                height: 1.6,
              ),
            ),
            if (widget.faq.category.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: context.primaryTintBackground,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  widget.faq.category,
                  style: TextStyle(
                    fontSize: 11,
                    color: context.onPrimaryTintBackground,
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
