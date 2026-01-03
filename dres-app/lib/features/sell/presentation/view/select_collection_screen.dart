import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/models/menu_model.dart';
import 'package:dres/features/sell/presentation/view/select_category_screen.dart';

/// Screen to select a collection (Clothing, Shoes, Accessories, etc.)
/// Second step in category selection flow
class SelectCollectionScreen extends StatefulWidget {
  final DepartmentModel department;

  const SelectCollectionScreen({super.key, required this.department});

  @override
  State<SelectCollectionScreen> createState() => _SelectCollectionScreenState();
}

class _SelectCollectionScreenState extends State<SelectCollectionScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<CollectionModel> get _filteredCollections {
    if (_searchQuery.isEmpty) {
      return widget.department.collections;
    }
    return widget.department.collections
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
            // Header with department name
            UnifiedHeader.titleOnly(title: widget.department.name),

            // Search input
            _buildSearchInput(),

            // Content
            Expanded(
              child: _filteredCollections.isEmpty
                  ? Center(
                      child: Text(
                        _searchQuery.isEmpty
                            ? 'No collections available'
                            : 'No collections found',
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: _filteredCollections.length,
                      itemBuilder: (context, index) {
                        final collection = _filteredCollections[index];
                        return _CollectionItem(
                          department: widget.department,
                          collection: collection,
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchInput() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Container(
        height: 44,
        decoration: BoxDecoration(
          color: AppColors.secondary,
          borderRadius: BorderRadius.circular(8),
        ),
        child: TextField(
          controller: _searchController,
          onChanged: (value) {
            setState(() {
              _searchQuery = value;
            });
          },
          style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
          decoration: InputDecoration(
            hintText: 'Search collections...',
            hintStyle: AppTypography.bodyM.copyWith(color: AppColors.textHint),
            prefixIcon: Padding(
              padding: const EdgeInsets.all(12),
              child: PhosphorIcon(
                PhosphorIcons.magnifyingGlass(),
                color: AppColors.textHint,
                size: 20,
              ),
            ),
            suffixIcon: _searchQuery.isNotEmpty
                ? GestureDetector(
                    onTap: () {
                      _searchController.clear();
                      setState(() {
                        _searchQuery = '';
                      });
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: PhosphorIcon(
                        PhosphorIcons.x(),
                        color: AppColors.textHint,
                        size: 20,
                      ),
                    ),
                  )
                : null,
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
          ),
        ),
      ),
    );
  }
}

class _CollectionItem extends StatelessWidget {
  final DepartmentModel department;
  final CollectionModel collection;

  const _CollectionItem({required this.department, required this.collection});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        InkWell(
          onTap: () async {
            // Navigate to category selection and await result
            final result = await context.push<SelectedCategoryData>(
              '/sell/select-category',
              extra: {'department': department, 'collection': collection},
            );

            // If we got a result, pop back with it
            if (result != null && context.mounted) {
              context.pop(result);
            }
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  collection.name,
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
