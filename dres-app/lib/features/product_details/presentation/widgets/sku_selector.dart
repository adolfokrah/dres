import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/features/product_details/data/models/product_details_model.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

class SkuSelector extends StatelessWidget {
  final List<SkuModel> skus;
  final String? selectedSkuId;
  final Function(String skuId) onSkuSelected;

  const SkuSelector({
    super.key,
    required this.skus,
    this.selectedSkuId,
    required this.onSkuSelected,
  });

  SkuModel? get _selectedSku {
    if (selectedSkuId == null || skus.isEmpty) return null;
    try {
      return skus.firstWhere((sku) => sku.id == selectedSkuId);
    } catch (e) {
      return skus.first;
    }
  }

  // Get unique options grouped by attribute
  Map<String, List<String>> _getGroupedOptions() {
    final Map<String, Set<String>> optionsMap = {};

    for (final sku in skus) {
      for (final option in sku.options) {
        if (!optionsMap.containsKey(option.option)) {
          optionsMap[option.option] = {};
        }
        optionsMap[option.option]!.add(option.value);
      }
    }

    // Convert sets to lists
    return optionsMap.map((key, value) => MapEntry(key, value.toList()));
  }

  String _getSelectedValueForOption(String optionName) {
    final selectedSku = _selectedSku;
    if (selectedSku == null) return '';

    try {
      final option = selectedSku.options.firstWhere(
        (opt) => opt.option == optionName,
      );
      return option.value;
    } catch (e) {
      return '';
    }
  }

  void _showOptionBottomSheet(
    BuildContext context,
    String optionName,
    List<String> values,
  ) {
    final currentValue = _getSelectedValueForOption(optionName);

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
                    optionName,
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

            // Options list
            ...values.map((value) {
              final isSelected = value == currentValue;

              return InkWell(
                onTap: () {
                  // Find SKU that matches this option value
                  final newSku = _findSkuWithOption(optionName, value);
                  if (newSku != null) {
                    onSkuSelected(newSku.id);
                    Navigator.pop(context);
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 16,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        value,
                        style: AppTypography.bodyL.copyWith(
                          fontWeight:
                              isSelected ? FontWeight.w600 : FontWeight.w400,
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
            }).toList(),
          ],
        ),
      ),
    );
  }

  SkuModel? _findSkuWithOption(String optionName, String optionValue) {
    final currentSku = _selectedSku;
    if (currentSku == null) return null;

    // Try to find a SKU that matches the selected option value
    // while keeping other options the same
    for (final sku in skus) {
      bool hasMatchingOption = false;
      bool hasConflictingOption = false;

      for (final option in sku.options) {
        if (option.option == optionName) {
          hasMatchingOption = option.value == optionValue;
        } else {
          // Check if other options match current selection
          final currentOption = currentSku.options.firstWhere(
            (opt) => opt.option == option.option,
            orElse: () => option,
          );
          if (option.value != currentOption.value) {
            hasConflictingOption = true;
          }
        }
      }

      if (hasMatchingOption && !hasConflictingOption) {
        return sku;
      }
    }

    // If no exact match, find any SKU with the selected option
    try {
      return skus.firstWhere((sku) =>
          sku.options.any((opt) =>
              opt.option == optionName && opt.value == optionValue));
    } catch (e) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (skus.isEmpty) return const SizedBox.shrink();

    final groupedOptions = _getGroupedOptions();
    if (groupedOptions.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: groupedOptions.entries.map((entry) {
        final optionName = entry.key;
        final values = entry.value;
        final selectedValue = _getSelectedValueForOption(optionName);

        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Option label
              Text(
                optionName,
                style: AppTypography.bodyM.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),

              // Selector button
              GestureDetector(
                onTap: () => _showOptionBottomSheet(context, optionName, values),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: AppColors.textPrimary,
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        selectedValue.isNotEmpty ? selectedValue : 'Select $optionName',
                        style: AppTypography.bodyM,
                      ),
                      PhosphorIcon(
                        PhosphorIconsRegular.caretDown,
                        size: 16,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
