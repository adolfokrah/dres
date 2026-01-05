import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_search_input.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/models/menu_model.dart';

/// Data class to hold selected category information
class SelectedCategoryData {
  final String departmentId;
  final String departmentName;
  final String collectionId;
  final String collectionName;
  final String categoryId;
  final String categoryName;

  SelectedCategoryData({
    required this.departmentId,
    required this.departmentName,
    required this.collectionId,
    required this.collectionName,
    required this.categoryId,
    required this.categoryName,
  });

  /// Returns the display string like "Men / Clothing / Trousers"
  String get displayText => '$departmentName / $collectionName / $categoryName';
}

/// Screen to select a category (Trousers, Shirts, etc.)
/// Final step in category selection flow
class SelectCategoryScreen extends StatefulWidget {
  final DepartmentModel department;
  final CollectionModel collection;

  const SelectCategoryScreen({
    super.key,
    required this.department,
    required this.collection,
  });

  @override
  State<SelectCategoryScreen> createState() => _SelectCategoryScreenState();
}

class _SelectCategoryScreenState extends State<SelectCategoryScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<CategoryModel> get _filteredCategories {
    if (_searchQuery.isEmpty) {
      return widget.collection.categories;
    }
    return widget.collection.categories
        .where((c) => c.name.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header with collection name
            UnifiedHeader.titleOnly(title: widget.collection.name),

            // Breadcrumb showing current path
            _buildBreadcrumb(),

            // Search input
            AppSearchInput(
              controller: _searchController,
              hintText: 'Search categories...',
              padding: const EdgeInsets.all(20),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
            ),

            // Content
            Expanded(
              child: _filteredCategories.isEmpty
                  ? Center(
                      child: Text(
                        _searchQuery.isEmpty
                            ? 'No categories available'
                            : 'No categories found',
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: _filteredCategories.length,
                      itemBuilder: (context, index) {
                        final category = _filteredCategories[index];
                        return _buildCategoryItem(context, category);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBreadcrumb() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      color: AppColors.secondary,
      child: Text(
        '${widget.department.name} / ${widget.collection.name}',
        style: AppTypography.bodyS.copyWith(color: AppColors.textSecondary),
      ),
    );
  }

  Widget _buildCategoryItem(BuildContext context, CategoryModel category) {
    return Column(
      children: [
        InkWell(
          onTap: () {
            // Create the selected category data
            final selectedData = SelectedCategoryData(
              departmentId: widget.department.id,
              departmentName: widget.department.name,
              collectionId: widget.collection.id,
              collectionName: widget.collection.name,
              categoryId: category.id,
              categoryName: category.name,
            );

            // Pop back with the selected data
            context.pop(selectedData);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  category.name,
                  style: AppTypography.bodyL.copyWith(fontSize: 18),
                ),
                PhosphorIcon(
                  PhosphorIconsRegular.caretRight,
                  color: AppColors.textSecondary,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
        Divider(
          height: 1,
          thickness: 1,
          color: AppColors.border.withValues(alpha: 0.2),
          indent: 20,
          endIndent: 20,
        ),
      ],
    );
  }
}
