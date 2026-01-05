import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/features/search/data/models/search_models.dart';

class ItemsSearchResults extends StatelessWidget {
  final String query;
  final List<ItemSearchResult> items;
  final List<BrandSearchResult> brands;
  final bool isLoading;

  const ItemsSearchResults({
    super.key,
    required this.query,
    required this.items,
    required this.brands,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (items.isEmpty && brands.isEmpty) {
      return Center(
        child: Text(
          'No results found',
          style: AppTypography.bodyL.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      children: [
        // Items section (categories + styles)
        if (items.isNotEmpty) ...[
          _buildSectionHeader('ALL RESULTS FOR «$query»'),
          ...items.map((item) => _buildItemResult(context, item)),
          const SizedBox(height: 16),
        ],

        // Brands section
        if (brands.isNotEmpty) ...[
          _buildSectionHeader('BRANDS'),
          ...brands.map((brand) => _buildBrandItem(context, brand)),
        ],
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Text(
        title,
        style: AppTypography.bodyS.copyWith(
          color: AppColors.textSecondary,
          fontWeight: FontWeight.w500,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildItemResult(BuildContext context, ItemSearchResult item) {
    return InkWell(
      onTap: () {
        if (item.isCategory) {
          // Navigate with categoryId + departmentId (filter by category within department)
          final params = <String>[];
          params.add('categoryId=${item.id}');
          if (item.departmentId != null) params.add('departmentId=${item.departmentId}');
          params.add('title=${Uri.encodeComponent(item.searchTitle)}');
          context.push('/products?${params.join('&')}');
        } else if (item.isCollection) {
          // Navigate with collectionId + departmentId (filter by collection within department)
          final params = <String>[];
          params.add('collectionId=${item.id}');
          if (item.departmentId != null) params.add('departmentId=${item.departmentId}');
          params.add('title=${Uri.encodeComponent(item.searchTitle)}');
          context.push('/products?${params.join('&')}');
        } else if (item.isStyle) {
          // Navigate with styleId + categoryId (filter by style within category)
          final params = <String>[];
          params.add('styleId=${item.id}');
          if (item.categoryId != null) params.add('categoryId=${item.categoryId}');
          params.add('title=${Uri.encodeComponent(item.searchTitle)}');
          context.push('/products?${params.join('&')}');
        } else if (item.isVariation) {
          // Navigate to product details page
          context.push('/products/${item.slug ?? item.id}');
        } else {
          // Fallback: navigate to products with query
          context.push('/products?query=${Uri.encodeComponent(item.query)}&title=${Uri.encodeComponent(item.searchTitle)}');
        }
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: _buildHighlightedText(item.searchTitle, query),
      ),
    );
  }

  Widget _buildBrandItem(BuildContext context, BrandSearchResult brand) {
    return InkWell(
      onTap: () {
        context.push('/products?brandId=${brand.id}&title=${Uri.encodeComponent(brand.name)}');
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: _buildHighlightedText(brand.name, query),
      ),
    );
  }

  Widget _buildHighlightedText(String text, String highlight) {
    final lowerText = text.toLowerCase();
    final lowerHighlight = highlight.toLowerCase();
    final startIndex = lowerText.indexOf(lowerHighlight);

    if (startIndex == -1) {
      return Text(
        text,
        style: AppTypography.bodyL.copyWith(
          color: AppColors.textPrimary,
        ),
      );
    }

    final endIndex = startIndex + highlight.length;
    final beforeMatch = text.substring(0, startIndex);
    final match = text.substring(startIndex, endIndex);
    final afterMatch = text.substring(endIndex);

    return RichText(
      text: TextSpan(
        style: AppTypography.bodyL.copyWith(
          color: AppColors.textPrimary,
        ),
        children: [
          TextSpan(text: beforeMatch),
          TextSpan(
            text: match,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          TextSpan(text: afterMatch),
        ],
      ),
    );
  }
}
