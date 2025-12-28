import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/models/menu_model.dart';
import 'package:go_router/go_router.dart';

class CategoriesScreen extends StatelessWidget {
  final CollectionModel collection;
  final String departmentName;

  const CategoriesScreen({
    super.key,
    required this.collection,
    required this.departmentName,
  });

  @override
  Widget build(BuildContext context) {
    // Debug: Print collection name
    debugPrint('Categories Screen - Collection: ${collection.name}, Department: $departmentName');
    
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios,
            color: AppColors.textPrimary,
            size: 20,
          ),
          onPressed: () => context.pop(),
        ),
        title: Text(
          collection.name,
          style: AppTypography.bodyL.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: collection.categories.length + 1,
        itemBuilder: (context, index) {
          // First item: "All {Department} {Collection}"
          if (index == 0) {
            return _buildCategoryItem(
              context,
              'All $departmentName ${collection.name}',
              collectionId: collection.id,
              isAll: true,
            );
          }

          // Rest: individual categories
          final category = collection.categories[index - 1];
          return _buildCategoryItem(
            context,
            category.name,
            categoryId: category.id,
          );
        },
      ),
    );
  }

  Widget _buildCategoryItem(
    BuildContext context,
    String categoryName, {
    String? categoryId,
    String? collectionId,
    bool isAll = false,
  }) {
    return Column(
      children: [
        InkWell(
          onTap: () {
            context.push(
              '/discover/categories/products',
              extra: {
                'categoryId': categoryId,
                'collectionId': collectionId,
                'title': categoryName,
              },
            );
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  categoryName,
                  style: AppTypography.bodyL.copyWith(
                    fontSize: 18,
                    fontWeight: isAll ? FontWeight.w600 : FontWeight.w400,
                  ),
                ),
                Icon(
                  Icons.chevron_right,
                  color: AppColors.textSecondary,
                  size: 25,
                ),
              ],
            ),
          ),
        ),
        Divider(
          height: 1,
          thickness: 1,
          color: AppColors.border.withValues(alpha: 0.4),
          indent: 16,
          endIndent: 16,
        ),
      ],
    );
  }
}
