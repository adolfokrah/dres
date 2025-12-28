import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/simple_header.dart';
import 'package:dres/features/shop/logic/brands_bloc/brands_bloc.dart';
import 'package:dres/features/shop/logic/brands_bloc/brands_event.dart';
import 'package:dres/features/shop/logic/brands_bloc/brands_state.dart';
import 'package:dres/core/models/brand_model.dart';

class BrandsScreen extends StatelessWidget {
  final String departmentId;
  final String departmentName;

  const BrandsScreen({
    super.key,
    required this.departmentId,
    required this.departmentName,
  });

  @override
  Widget build(BuildContext context) {
    // Add event to fetch brands
    context.read<BrandsBloc>().add(FetchBrands(departmentId: departmentId));
    
    return _BrandsScreenView(
      departmentId: departmentId,
      departmentName: departmentName,
    );
  }
}

class _BrandsScreenView extends StatefulWidget {
  final String departmentId;
  final String departmentName;

  const _BrandsScreenView({
    required this.departmentId,
    required this.departmentName,
  });

  @override
  State<_BrandsScreenView> createState() => _BrandsScreenViewState();
}

class _BrandsScreenViewState extends State<_BrandsScreenView> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
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
            SimpleHeader(
              title: 'Brands A-Z',
              onCartTap: () {},
            ),

            // Search Bar
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _searchController,
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
                decoration: InputDecoration(
                  hintText: 'Search brands',
                  hintStyle: AppTypography.bodyM.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  prefixIcon: Icon(
                    Icons.search,
                    color: AppColors.textSecondary,
                  ),
                  filled: true,
                  fillColor: AppColors.secondary,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
              ),
            ),

            // Brands List
            Expanded(
              child: BlocBuilder<BrandsBloc, BrandsState>(
                builder: (context, state) {
                  if (state.status == BrandsStatus.loading) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  if (state.status == BrandsStatus.failure) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Failed to load brands',
                            style: AppTypography.bodyL,
                          ),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () {
                              context.read<BrandsBloc>().add(
                                    FetchBrands(departmentId: widget.departmentId),
                                  );
                            },
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    );
                  }

                  final allBrands = state.brands;
                  final filteredBrands = _searchQuery.isEmpty
                      ? allBrands
                      : allBrands
                          .where((brand) =>
                              brand.name.toLowerCase().contains(_searchQuery.toLowerCase()))
                          .toList();

                  if (filteredBrands.isEmpty) {
                    return Center(
                      child: Text(
                        'No brands found',
                        style: AppTypography.bodyL,
                      ),
                    );
                  }

                  // Group brands by first letter
                  final grouped = <String, List<BrandModel>>{};
                  for (var brand in filteredBrands) {
                    final firstLetter = brand.name[0].toUpperCase();
                    if (!grouped.containsKey(firstLetter)) {
                      grouped[firstLetter] = [];
                    }
                    grouped[firstLetter]!.add(brand);
                  }

                  final alphabetLetters = grouped.keys.toList()..sort();

                  return Row(
                    children: [
                      // Brands List
                      Expanded(
                        child: CustomScrollView(
                          slivers: alphabetLetters.map((letter) {
                            final brands = grouped[letter]!;
                            return SliverMainAxisGroup(
                              slivers: [
                                // Sticky Letter Header
                                SliverPersistentHeader(
                                  pinned: true,
                                  delegate: _StickyHeaderDelegate(
                                    minHeight: 40,
                                    maxHeight: 40,
                                    child: Container(
                                      color: AppColors.background,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 16,
                                        vertical: 8,
                                      ),
                                      alignment: Alignment.centerLeft,
                                      child: Text(
                                        letter,
                                        style: AppTypography.titleLM.copyWith(
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.textSecondary,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                // Brands under this letter
                                SliverList(
                                  delegate: SliverChildBuilderDelegate(
                                    (context, index) => _buildBrandItem(brands[index]),
                                    childCount: brands.length,
                                  ),
                                ),
                              ],
                            );
                          }).toList(),
                        ),
                      ),

                      // Alphabet Index
                      Container(
                        width: 24,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'
                              .split('')
                              .map((letter) => Expanded(
                                    child: Center(
                                      child: Text(
                                        letter,
                                        style: AppTypography.bodyXS.copyWith(
                                          color: alphabetLetters.contains(letter)
                                              ? AppColors.textPrimary
                                              : AppColors.textSecondary,
                                          fontWeight: alphabetLetters.contains(letter)
                                              ? FontWeight.w600
                                              : FontWeight.w400,
                                        ),
                                      ),
                                    ),
                                  ))
                              .toList(),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBrandItem(BrandModel brand) {
    return Column(
      children: [
        InkWell(
          onTap: () {
            // Navigate to products filtered by this brand and department
            context.push(
              '/discover/categories/products',
              extra: {
                'departmentId': widget.departmentId,
                'brandId': brand.id,
                'title': brand.name,
              },
            );
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    brand.name,
                    style: AppTypography.bodyL.copyWith(
                      fontSize: 16,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        Divider(
          height: 1,
          thickness: 1,
          color: AppColors.border.withValues(alpha: 0.1),
          indent: 16,
        ),
      ],
    );
  }
}

// Sticky Header Delegate
class _StickyHeaderDelegate extends SliverPersistentHeaderDelegate {
  final double minHeight;
  final double maxHeight;
  final Widget child;

  _StickyHeaderDelegate({
    required this.minHeight,
    required this.maxHeight,
    required this.child,
  });

  @override
  double get minExtent => minHeight;

  @override
  double get maxExtent => maxHeight;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return SizedBox.expand(child: child);
  }

  @override
  bool shouldRebuild(_StickyHeaderDelegate oldDelegate) {
    return maxHeight != oldDelegate.maxHeight ||
        minHeight != oldDelegate.minHeight ||
        child != oldDelegate.child;
  }
}
