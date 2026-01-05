import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/models/menu_model.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/widgets/user_list_item.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/splash/data/repositories/menu_repository.dart';
import 'package:go_router/go_router.dart';

class CategoriesScreen extends StatefulWidget {
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
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  List<TopSeller> _topSellers = [];
  bool _isLoadingTopSellers = true;

  @override
  void initState() {
    super.initState();
    _fetchTopSellers();
  }

  Future<void> _fetchTopSellers() async {
    try {
      final sellers = await getIt<MenuRepository>().fetchTopSellers(
        collectionId: widget.collection.id,
        departmentId: widget.departmentId,
        limit: 5,
      );
      if (mounted) {
        setState(() {
          _topSellers = sellers;
          _isLoadingTopSellers = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingTopSellers = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Header
            UnifiedHeader.simple(title: widget.collection.name.toUpperCase()),

            // Categories List and Top Sellers
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  // First item: "All {Department} {Collection}"
                  _buildCategoryItem(
                    context,
                    'All ${widget.departmentName} ${widget.collection.name}',
                    departmentId: widget.departmentId,
                    collectionId: widget.collection.id,
                    isAll: true,
                  ),
                  // Individual categories
                  ...widget.collection.categories.map((category) =>
                    _buildCategoryItem(
                      context,
                      category.name,
                      departmentId: widget.departmentId,
                      categoryId: category.id,
                    ),
                  ),
                  // Top Sellers Section
                  if (!_isLoadingTopSellers && _topSellers.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'TOP SELLERS',
                        style: AppTypography.bodyL.copyWith(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    ..._topSellers.map((seller) => UserListItem(
                      id: seller.id,
                      name: seller.shopName ?? seller.name,
                      username: seller.username,
                      avatarUrl: seller.avatarUrl,
                      badge: 'TOP SELLER',
                    )),
                  ],
                  // Loading indicator for top sellers
                  if (_isLoadingTopSellers)
                    const Padding(
                      padding: EdgeInsets.all(24),
                      child: Center(
                        child: SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ),
                ],
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
                PhosphorIcon(
                  PhosphorIconsRegular.caretRight,
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
