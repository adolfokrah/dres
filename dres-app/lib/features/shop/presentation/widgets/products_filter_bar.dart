import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

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
  final Function(SortOption) onSortChanged;
  final Function(PriceOption) onPriceChanged;

  const ProductsFilterBar({
    super.key,
    required this.selectedSort,
    required this.selectedPrice,
    required this.onSortChanged,
    required this.onPriceChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 6),
      child: Row(
        children: [
          // Sort Filter
          _buildFilterButton(
            context: context,
            label: selectedSort == SortOption.latest ? 'Latest' : 'Oldest',
            onTap: () => _showSortOptions(context),
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
          ),
        ],
      ),
    );
  }

  Widget _buildFilterButton({
    required BuildContext context,
    required String label,
    required VoidCallback onTap,
    bool isWide = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 36,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.textSecondary),
          borderRadius: BorderRadius.zero,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textPrimary,
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
}
