import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/models/menu_model.dart';
import 'package:dres/core/widgets/app_header.dart';
import 'package:go_router/go_router.dart';

class CategoriesScreen extends StatelessWidget {
  final CollectionModel collection;
  final String departmentName;
  final String departmentId;

  const CategoriesScreen({
    super.key,
    required this.collection,
    required this.departmentName,
    required this.departmentId,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Header with back button
            AppHeader(
              showBackButton: true,
              onBackTap: () => context.pop(),
              onCartTap: () {},
              onSearchTap: () {},
            ),
            
            // Title
            Padding(
              padding: const EdgeInsets.all(16),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  collection.name.toUpperCase(),
                  style: AppTypography.titleLM.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            
            // Categories List
            Expanded(
              child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: collection.categories.length + 1,
        itemBuilder: (context, index) {
          // First item: "All {Department} {Collection}"
          if (index == 0) {
            return _buildCategoryItem(
              context,
              'All $departmentName ${collection.name}',
              departmentId: departmentId,
              collectionId: collection.id,
              isAll: true,
            );
          }

          // Rest: individual categories
          final category = collection.categories[index - 1];
          return _buildCategoryItem(
            context,
            category.name,
            departmentId: departmentId,
            categoryId: category.id,
          );
        },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryItem(
    BuildContext context,
    String categoryName, {
    required String departmentId,
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
                'departmentId': departmentId,
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
