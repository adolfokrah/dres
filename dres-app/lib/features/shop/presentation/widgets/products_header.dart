import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

class ProductsHeader extends StatelessWidget {
  final String title;
  final int itemCount;
  final VoidCallback onSaveSearch;

  const ProductsHeader({
    super.key,
    required this.title,
    required this.itemCount,
    required this.onSaveSearch,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Title and item count
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title.toUpperCase(),
                style: AppTypography.bodyL.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                itemCount > 999 ? '999+ items' : '$itemCount items',
                style: AppTypography.bodyM,
              ),
            ],
          ),
          
          // Save this search button
          GestureDetector(
            onTap: onSaveSearch,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Save this search',
                  style: AppTypography.bodyM,
                ),
                const SizedBox(width: 9),
                Icon(
                  PhosphorIcons.bookmarkSimple(),
                  size: 20,
                  color: AppColors.textPrimary,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
