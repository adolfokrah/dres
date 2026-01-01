import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

/// Filter option model
class FilterOption {
  final String? value;
  final String label;

  const FilterOption({
    this.value,
    required this.label,
  });
}

/// Status filter chips for orders (purchases)
class StatusFilterChips extends StatelessWidget {
  final String? selectedFilter;
  final ValueChanged<String?> onFilterChanged;

  const StatusFilterChips({
    super.key,
    this.selectedFilter,
    required this.onFilterChanged,
  });

  static const List<FilterOption> filters = [
    FilterOption(value: null, label: 'All'),
    FilterOption(value: 'in_progress', label: 'In progress'),
    FilterOption(value: 'cancelled', label: 'Cancelled'),
    FilterOption(value: 'completed', label: 'Completed'),
  ];

  @override
  Widget build(BuildContext context) {
    return _FilterChipsRow(
      filters: filters,
      selectedFilter: selectedFilter,
      onFilterChanged: onFilterChanged,
    );
  }
}

/// Status filter chips for incoming orders (seller view)
class IncomingOrdersFilterChips extends StatelessWidget {
  final String? selectedFilter;
  final ValueChanged<String?> onFilterChanged;

  const IncomingOrdersFilterChips({
    super.key,
    this.selectedFilter,
    required this.onFilterChanged,
  });

  static const List<FilterOption> filters = [
    FilterOption(value: null, label: 'All'),
    FilterOption(value: 'new', label: 'New'),
    FilterOption(value: 'cancelled', label: 'Cancelled'),
    FilterOption(value: 'completed', label: 'Completed'),
  ];

  @override
  Widget build(BuildContext context) {
    return _FilterChipsRow(
      filters: filters,
      selectedFilter: selectedFilter,
      onFilterChanged: onFilterChanged,
    );
  }
}

class _FilterChipsRow extends StatelessWidget {
  final List<FilterOption> filters;
  final String? selectedFilter;
  final ValueChanged<String?> onFilterChanged;

  const _FilterChipsRow({
    required this.filters,
    this.selectedFilter,
    required this.onFilterChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      child: Row(
        children: filters.map((filter) {
          final isSelected = selectedFilter == filter.value;
          return Padding(
            padding: const EdgeInsets.only(right: 7),
            child: _FilterChip(
              label: filter.label,
              isSelected: isSelected,
              onTap: () => onFilterChanged(filter.value),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.background,
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.textHint,
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isSelected) ...[
              Icon(
                PhosphorIcons.check(),
                size: 14,
                color: AppColors.textOnPrimary,
              ),
              const SizedBox(width: 5),
            ],
            Text(
              label,
              style: AppTypography.bodyM.copyWith(
                color: isSelected ? AppColors.textOnPrimary : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
