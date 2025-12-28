import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/models/attribute_filter_model.dart';

enum SortOption {
  latest,
  oldest,
}

enum PriceOption {
  all,
  lowToHigh,
  highToLow,
}

class ProductsFilterBar extends StatelessWidget {
  final SortOption selectedSort;
  final PriceOption selectedPrice;
  final List<AttributeFilterModel> filters;
  final Map<String, List<String>> selectedAttributes;
  final double? minPrice;
  final double? maxPrice;
  final Function(SortOption) onSortChanged;
  final Function(PriceOption) onPriceChanged;
  final Function(String attributeId, List<String> optionIds)? onAttributeFilterChanged;
  final Function(double? min, double? max)? onPriceRangeChanged;

  const ProductsFilterBar({
    super.key,
    required this.selectedSort,
    required this.selectedPrice,
    this.filters = const [],
    this.selectedAttributes = const {},
    this.minPrice,
    this.maxPrice,
    required this.onSortChanged,
    required this.onPriceChanged,
    this.onAttributeFilterChanged,
    this.onPriceRangeChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 15),
        children: [
          // Sort Filter
          _buildFilterButton(
            context: context,
            label: selectedSort == SortOption.latest ? 'Latest' : 'Oldest',
            onTap: () => _showSortOptions(context),
            isActive: false, // Sort is always applied, so not marked as active
          ),
          const SizedBox(width: 7),
          
          // Price Filter
          _buildFilterButton(
            context: context,
            label: selectedPrice == PriceOption.all
                ? 'Price Any'
                : selectedPrice == PriceOption.lowToHigh 
                    ? 'Price Low to High' 
                    : 'Price High to Low',
            isWide: true,
            onTap: () => _showPriceOptions(context),
            isActive: selectedPrice != PriceOption.all,
          ),
          const SizedBox(width: 7),
          
          // Price Range Filter
          _buildFilterButton(
            context: context,
            label: (minPrice != null || maxPrice != null)
                ? 'GH₵${minPrice?.toStringAsFixed(0) ?? '0'} - GH₵${maxPrice?.toStringAsFixed(0) ?? '∞'}'
                : 'Price Range',
            isWide: true,
            onTap: () => _showPriceRangeDialog(context),
            isActive: minPrice != null || maxPrice != null,
          ),
          const SizedBox(width: 7),
          
          // Attribute Filters
          ...filters.map((filter) {
            final hasSelection = selectedAttributes.containsKey(filter.id) && 
                                 selectedAttributes[filter.id]!.isNotEmpty;
            
            // Get selected option names for display
            String label = filter.name;
            if (hasSelection) {
              final selectedIds = selectedAttributes[filter.id]!;
              final selectedOptions = filter.options
                  .where((opt) => selectedIds.contains(opt.id))
                  .map((opt) => opt.name)
                  .toList();
              if (selectedOptions.isNotEmpty) {
                label = '${filter.name}: ${selectedOptions.join(', ')}';
              }
            }
            
            return Padding(
              padding: const EdgeInsets.only(left: 7),
              child: _buildFilterButton(
                context: context,
                label: label,
                onTap: () => _showAttributeOptions(context, filter),
                isActive: hasSelection,
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildFilterButton({
    required BuildContext context,
    required String label,
    required VoidCallback onTap,
    bool isWide = false,
    bool isActive = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 36,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          border: Border.all(
            color: isActive ? AppColors.textPrimary : AppColors.textSecondary,
            width: isActive ? 2 : 1,
          ),
          borderRadius: BorderRadius.zero,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textPrimary,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
            const SizedBox(width: 10),
            PhosphorIcon(
              PhosphorIconsRegular.caretDown,
              size: 14,
              color: AppColors.textPrimary,
            ),
          ],
        ),
      ),
    );
  }

  void _showSortOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(0)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Sort By',
                    style: AppTypography.titleLM.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  IconButton(
                    icon: PhosphorIcon(
                      PhosphorIconsRegular.x,
                      size: 24,
                    ),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            
            // Latest Option
            _buildOption(
              context: context,
              label: 'Latest',
              isSelected: selectedSort == SortOption.latest,
              onTap: () {
                onSortChanged(SortOption.latest);
                Navigator.pop(context);
              },
            ),
            
            // Oldest Option
            _buildOption(
              context: context,
              label: 'Oldest',
              isSelected: selectedSort == SortOption.oldest,
              onTap: () {
                onSortChanged(SortOption.oldest);
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showPriceOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(0)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Price',
                    style: AppTypography.titleLM.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  IconButton(
                    icon: PhosphorIcon(
                      PhosphorIconsRegular.x,
                      size: 24,
                    ),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            
            // Price Any Option
            _buildOption(
              context: context,
              label: 'Price Any',
              isSelected: selectedPrice == PriceOption.all,
              onTap: () {
                onPriceChanged(PriceOption.all);
                Navigator.pop(context);
              },
            ),
            
            // Low to High Option
            _buildOption(
              context: context,
              label: 'Price Low to High',
              isSelected: selectedPrice == PriceOption.lowToHigh,
              onTap: () {
                onPriceChanged(PriceOption.lowToHigh);
                Navigator.pop(context);
              },
            ),
            
            // High to Low Option
            _buildOption(
              context: context,
              label: 'Price High to Low',
              isSelected: selectedPrice == PriceOption.highToLow,
              onTap: () {
                onPriceChanged(PriceOption.highToLow);
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOption({
    required BuildContext context,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: AppTypography.bodyL.copyWith(
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
            if (isSelected)
              PhosphorIcon(
                PhosphorIconsRegular.check,
                size: 20,
                color: AppColors.textPrimary,
              ),
          ],
        ),
      ),
    );
  }

  void _showAttributeOptions(BuildContext context, AttributeFilterModel filter) {
    final initialSelection = List<String>.from(selectedAttributes[filter.id] ?? []);
    
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(0)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setState) {
          return Container(
            padding: const EdgeInsets.symmetric(vertical: 20),
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.7,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        filter.name,
                        style: AppTypography.titleLM.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      IconButton(
                        icon: PhosphorIcon(
                          PhosphorIconsRegular.x,
                          size: 24,
                        ),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                
                // Scrollable Options
                Flexible(
                  child: SingleChildScrollView(
                    child: Column(
                      children: filter.options.map((option) {
                        final isSelected = initialSelection.contains(option.id);
                        return _buildOption(
                          context: context,
                          label: option.name,
                          isSelected: isSelected,
                          onTap: () {
                            setState(() {
                              if (isSelected) {
                                initialSelection.remove(option.id);
                              } else {
                                initialSelection.add(option.id);
                              }
                            });
                          },
                        );
                      }).toList(),
                    ),
                  ),
                ),
                
                // Apply and Reset Buttons
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      // Reset Button (only show if there are selections)
                      if (initialSelection.isNotEmpty) ...[
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              onAttributeFilterChanged?.call(filter.id, []);
                              Navigator.pop(context);
                            },
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.textPrimary,
                              side: BorderSide(color: AppColors.textPrimary),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: const RoundedRectangleBorder(
                                borderRadius: BorderRadius.zero,
                              ),
                            ),
                            child: Text(
                              'Reset',
                              style: AppTypography.bodyL.copyWith(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                      ],
                      // Apply Button
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            onAttributeFilterChanged?.call(filter.id, initialSelection);
                            Navigator.pop(context);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.textPrimary,
                            foregroundColor: AppColors.surface,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: const RoundedRectangleBorder(
                              borderRadius: BorderRadius.zero,
                            ),
                          ),
                          child: Text(
                            'Apply',
                            style: AppTypography.bodyL.copyWith(
                              color: AppColors.surface,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showPriceRangeDialog(BuildContext context) {
    final minController = TextEditingController(
      text: minPrice?.toStringAsFixed(0) ?? '',
    );
    final maxController = TextEditingController(
      text: maxPrice?.toStringAsFixed(0) ?? '',
    );

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(0)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Price Range',
                      style: AppTypography.titleLM.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    IconButton(
                      icon: PhosphorIcon(
                        PhosphorIconsRegular.x,
                        size: 24,
                      ),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              
              // Input Fields
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    // Min Price
                    Expanded(
                      child: TextField(
                        controller: minController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Min Price',
                          labelStyle: AppTypography.bodyM.copyWith(
                            color: AppColors.textSecondary,
                          ),
                          prefixText: 'GH₵ ',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.zero,
                            borderSide: BorderSide(color: AppColors.textSecondary),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.zero,
                            borderSide: BorderSide(color: AppColors.textSecondary),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.zero,
                            borderSide: BorderSide(color: AppColors.textPrimary, width: 2),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    // Max Price
                    Expanded(
                      child: TextField(
                        controller: maxController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Max Price',
                          labelStyle: AppTypography.bodyM.copyWith(
                            color: AppColors.textSecondary,
                          ),
                          prefixText: 'GH₵ ',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.zero,
                            borderSide: BorderSide(color: AppColors.textSecondary),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.zero,
                            borderSide: BorderSide(color: AppColors.textSecondary),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.zero,
                            borderSide: BorderSide(color: AppColors.textPrimary, width: 2),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              // Buttons
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    // Reset Button
                    if (minPrice != null || maxPrice != null) ...[
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            onPriceRangeChanged?.call(null, null);
                            Navigator.pop(context);
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.textPrimary,
                            side: BorderSide(color: AppColors.textPrimary),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: const RoundedRectangleBorder(
                              borderRadius: BorderRadius.zero,
                            ),
                          ),
                          child: Text(
                            'Reset',
                            style: AppTypography.bodyL.copyWith(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    // Apply Button
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          final min = double.tryParse(minController.text);
                          final max = double.tryParse(maxController.text);
                          onPriceRangeChanged?.call(min, max);
                          Navigator.pop(context);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.textPrimary,
                          foregroundColor: AppColors.surface,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.zero,
                          ),
                        ),
                        child: Text(
                          'Apply',
                          style: AppTypography.bodyL.copyWith(
                            color: AppColors.surface,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
