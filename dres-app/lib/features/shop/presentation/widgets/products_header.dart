import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

class ProductsHeader extends StatelessWidget {
  final String title;
  final int itemCount;
  final VoidCallback? onSaveSearch;
  final bool isSearchSaved;

  const ProductsHeader({
    super.key,
    required this.title,
    required this.itemCount,
    this.onSaveSearch,
    this.isSearchSaved = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Title and item count
          Expanded(
            child: ClipRect(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title.toUpperCase(),
                    style: AppTypography.bodyL.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    itemCount > 999 ? '999+ items' : '$itemCount items',
                    style: AppTypography.bodyM,
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(width: 10),

          // Save this search button
          GestureDetector(
            onTap: onSaveSearch,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  isSearchSaved ? 'Search saved' : 'Save this search',
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(width: 9),
                Icon(
                  isSearchSaved ? PhosphorIcons.bookmarkSimple(PhosphorIconsStyle.fill) : PhosphorIcons.bookmarkSimple(),
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
