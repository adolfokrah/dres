import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_search_input.dart';
import 'package:dres/core/widgets/unified_header.dart';

/// Screen to select multiple sizes with search functionality
class SelectSizesScreen extends StatefulWidget {
  final List<String> initialSelectedSizes;

  const SelectSizesScreen({
    super.key,
    this.initialSelectedSizes = const [],
  });

  @override
  State<SelectSizesScreen> createState() => _SelectSizesScreenState();
}

class _SelectSizesScreenState extends State<SelectSizesScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  late Set<String> _selectedSizes;

  // Available sizes organized by type
  final Map<String, List<String>> _sizesByType = {
    'Clothing': ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'],
    'Shoes (US)': [
      '5',
      '5.5',
      '6',
      '6.5',
      '7',
      '7.5',
      '8',
      '8.5',
      '9',
      '9.5',
      '10',
      '10.5',
      '11',
      '11.5',
      '12',
      '13',
      '14'
    ],
    'Shoes (EU)': [
      '35',
      '36',
      '37',
      '38',
      '39',
      '40',
      '41',
      '42',
      '43',
      '44',
      '45',
      '46',
      '47'
    ],
    'One Size': ['One Size'],
  };

  String? _expandedType;

  @override
  void initState() {
    super.initState();
    _selectedSizes = Set<String>.from(widget.initialSelectedSizes);
    // Auto-expand the first type that has selected sizes, or first type
    _expandedType = _getInitialExpandedType();
  }

  String? _getInitialExpandedType() {
    for (final entry in _sizesByType.entries) {
      if (entry.value.any((size) => _selectedSizes.contains(size))) {
        return entry.key;
      }
    }
    return _sizesByType.keys.first;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<String> _getFilteredSizes(List<String> sizes) {
    if (_searchQuery.isEmpty) {
      return sizes;
    }
    return sizes
        .where((size) => size.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();
  }

  bool _hasMatchesInType(String type) {
    if (_searchQuery.isEmpty) return true;
    return _sizesByType[type]!.any(
      (size) => size.toLowerCase().contains(_searchQuery.toLowerCase()),
    );
  }

  void _toggleSize(String size) {
    setState(() {
      if (_selectedSizes.contains(size)) {
        _selectedSizes.remove(size);
      } else {
        _selectedSizes.add(size);
      }
    });
  }

  void _done() {
    context.pop(_selectedSizes.toList());
  }

  @override
  Widget build(BuildContext context) {
    final hasSelection = _selectedSizes.isNotEmpty;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            const UnifiedHeader.simple(
              title: 'Select Sizes',
              showSearchIcon: false,
            ),

            // Selection count banner
            if (hasSelection)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                color: AppColors.secondary,
                child: Text(
                  '${_selectedSizes.length} size${_selectedSizes.length != 1 ? 's' : ''} selected',
                  style: AppTypography.bodyS.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ),

            // Search input
            AppSearchInput(
              controller: _searchController,
              hintText: 'Search sizes...',
              padding: const EdgeInsets.all(20),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
            ),

            // Content
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: _sizesByType.length,
                itemBuilder: (context, index) {
                  final type = _sizesByType.keys.elementAt(index);
                  if (!_hasMatchesInType(type)) {
                    return const SizedBox.shrink();
                  }
                  return _buildSizeTypeSection(type);
                },
              ),
            ),

            // Done Button
            if (hasSelection)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  border: Border(
                    top: BorderSide(
                      color: AppColors.border.withValues(alpha: 0.2),
                      width: 1,
                    ),
                  ),
                ),
                child: SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _done,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: AppColors.textOnPrimary,
                      shape: const RoundedRectangleBorder(),
                    ),
                    child: Text(
                      'Done (${_selectedSizes.length})',
                      style: AppTypography.bodyL.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textOnPrimary,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSizeTypeSection(String type) {
    final isExpanded = _expandedType == type;
    final sizes = _sizesByType[type]!;
    final filteredSizes = _getFilteredSizes(sizes);
    final selectedInType = sizes.where((s) => _selectedSizes.contains(s)).length;

    return Column(
      children: [
        // Type header (collapsible)
        InkWell(
          onTap: () {
            setState(() {
              _expandedType = isExpanded ? null : type;
            });
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            color: AppColors.surface,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    PhosphorIcon(
                      isExpanded
                          ? PhosphorIconsRegular.caretDown
                          : PhosphorIconsRegular.caretRight,
                      color: AppColors.textSecondary,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      type,
                      style: AppTypography.bodyL.copyWith(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
                if (selectedInType > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '$selectedInType',
                      style: AppTypography.bodyS.copyWith(
                        color: AppColors.textOnPrimary,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),

        // Size chips (when expanded)
        if (isExpanded)
          Container(
            padding: const EdgeInsets.all(20),
            child: Wrap(
              spacing: 12,
              runSpacing: 12,
              children: filteredSizes.map((size) {
                return _buildSizeChip(size);
              }).toList(),
            ),
          ),

        Divider(
          height: 1,
          thickness: 1,
          color: AppColors.border.withValues(alpha: 0.2),
        ),
      ],
    );
  }

  Widget _buildSizeChip(String size) {
    final isSelected = _selectedSizes.contains(size);

    return GestureDetector(
      onTap: () => _toggleSize(size),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surface,
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isSelected)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: PhosphorIcon(
                  PhosphorIconsRegular.check,
                  color: AppColors.textOnPrimary,
                  size: 16,
                ),
              ),
            Text(
              size,
              style: AppTypography.bodyM.copyWith(
                color: isSelected ? AppColors.textOnPrimary : AppColors.textPrimary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
