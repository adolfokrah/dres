import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/features/saved_searches/data/models/saved_search_models.dart';

class SavedSearchCard extends StatelessWidget {
  const SavedSearchCard({
    super.key,
    required this.savedSearch,
    required this.onDelete,
    required this.onToggleActive,
    required this.onTap,
  });

  final SavedSearchModel savedSearch;
  final VoidCallback onDelete;
  final ValueChanged<bool> onToggleActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppColors.background,
          border: Border.all(color: AppColors.border),
        ),
        child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        savedSearch.name ?? 'Unnamed Search',
                        style: AppTypography.bodyL.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _buildSearchDescription(),
                        style: AppTypography.bodyS.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  icon: Icon(
                    PhosphorIcons.dotsThreeVertical(),
                    color: AppColors.textSecondary,
                  ),
                  onSelected: (value) {
                    switch (value) {
                      case 'delete':
                        onDelete();
                        break;
                    }
                  },
                  itemBuilder: (context) => [
                    PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(
                            PhosphorIcons.trash(),
                            color: AppColors.error,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Delete',
                            style: AppTypography.bodyM.copyWith(
                              color: AppColors.error,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Icon(
                  PhosphorIcons.clock(),
                  size: 14,
                  color: AppColors.textHint,
                ),
                const SizedBox(width: 4),
                Text(
                  'Created ${_formatDate(savedSearch.createdAt)}',
                  style: AppTypography.bodyXS.copyWith(
                    color: AppColors.textHint,
                  ),
                ),
                const Spacer(),
                Text(
                  'Active',
                  style: AppTypography.bodyS.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(width: 4),
                SizedBox(
                  height: 24,
                  child: Switch(
                    value: savedSearch.isActive,
                    onChanged: onToggleActive,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      ),
    );
  }

  String _buildSearchDescription() {
    final searchData = savedSearch.searchData;
    final List<String> filters = [];

    if (searchData['departmentName'] != null) {
      filters.add('Department: ${searchData['departmentName']}');
    }
    if (searchData['collectionName'] != null) {
      filters.add('Collection: ${searchData['collectionName']}');
    }
    if (searchData['categoryName'] != null) {
      filters.add('Category: ${searchData['categoryName']}');
    }
    if (searchData['brandName'] != null) {
      filters.add('Brand: ${searchData['brandName']}');
    }
    if (searchData['minPrice'] != null || searchData['maxPrice'] != null) {
      final min = searchData['minPrice'];
      final max = searchData['maxPrice'];
      if (min != null && max != null) {
        filters.add('Price: \$$min - \$$max');
      } else if (min != null) {
        filters.add('Min Price: \$$min');
      } else if (max != null) {
        filters.add('Max Price: \$$max');
      }
    }

    if (filters.isEmpty) {
      return 'All products';
    }

    return filters.take(2).join(' • ') + (filters.length > 2 ? ' • ...' : '');
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 0) {
      return '${difference.inDays} days ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hours ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minutes ago';
    } else {
      return 'Just now';
    }
  }
}