import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_search_input.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/features/shop/logic/brands_bloc/brands_bloc.dart';
import 'package:dres/features/shop/logic/brands_bloc/brands_event.dart';
import 'package:dres/features/shop/logic/brands_bloc/brands_state.dart';
import 'package:dres/core/models/brand_model.dart';

/// Data class to hold selected brand information
class SelectedBrandData {
  final String brandId;
  final String brandName;

  SelectedBrandData({required this.brandId, required this.brandName});
}

/// Screen to select a brand for sell flow
class SelectBrandScreen extends StatefulWidget {
  const SelectBrandScreen({super.key});

  @override
  State<SelectBrandScreen> createState() => _SelectBrandScreenState();
}

class _SelectBrandScreenState extends State<SelectBrandScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    // Fetch all brands (no department filter for sell flow)
    context.read<BrandsBloc>().add(const FetchBrands());
  }

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
            const UnifiedHeader.titleOnly(title: 'Select Brand'),

            // Search Bar
            AppSearchInput(
              controller: _searchController,
              hintText: 'Search brands...',
              padding: const EdgeInsets.all(20),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
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
                                const FetchBrands(),
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
                            .where(
                              (brand) => brand.name.toLowerCase().contains(
                                _searchQuery.toLowerCase(),
                              ),
                            )
                            .toList();

                  if (filteredBrands.isEmpty) {
                    return Center(
                      child: Text(
                        _searchQuery.isEmpty
                            ? 'No brands available'
                            : 'No brands found',
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
                                    (context, index) =>
                                        _buildBrandItem(brands[index]),
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
                              .map(
                                (letter) => Expanded(
                                  child: Center(
                                    child: Text(
                                      letter,
                                      style: AppTypography.bodyXS.copyWith(
                                        color: alphabetLetters.contains(letter)
                                            ? AppColors.textPrimary
                                            : AppColors.textSecondary,
                                        fontWeight:
                                            alphabetLetters.contains(letter)
                                            ? FontWeight.w600
                                            : FontWeight.w400,
                                      ),
                                    ),
                                  ),
                                ),
                              )
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
            // Return the selected brand
            final selectedData = SelectedBrandData(
              brandId: brand.id,
              brandName: brand.name,
            );
            context.pop(selectedData);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    brand.name,
                    style: AppTypography.bodyL.copyWith(fontSize: 18),
                    overflow: TextOverflow.ellipsis,
                  ),
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
          indent: 16,
          endIndent: 16,
        ),
      ],
    );
  }
}

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
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return SizedBox.expand(child: child);
  }

  @override
  bool shouldRebuild(_StickyHeaderDelegate oldDelegate) {
    return maxHeight != oldDelegate.maxHeight ||
        minHeight != oldDelegate.minHeight ||
        child != oldDelegate.child;
  }
}
