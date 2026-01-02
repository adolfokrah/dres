import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_header.dart';
import 'package:dres/core/widgets/product_card.dart';
import 'package:dres/core/widgets/product_card_skeleton.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/features/shop/logic/products_bloc/products_bloc.dart';
import 'package:dres/features/shop/logic/products_bloc/products_event.dart';
import 'package:dres/features/shop/logic/products_bloc/products_state.dart';
import 'package:dres/features/shop/presentation/widgets/products_header.dart';
import 'package:dres/features/shop/presentation/widgets/products_filter_bar.dart';
import 'package:dres/features/shop/presentation/widgets/products_empty_state.dart';
import 'package:dres/l10n/app_localizations.dart';

class ProductsScreen extends StatefulWidget {
  final String? departmentId;
  final String? categoryId;
  final String? collectionId;
  final String? brandId;
  final String? filterType; // 'new-arrivals', 'featured', 'trending', 'on-sale'
  final String title;

  const ProductsScreen({
    super.key,
    this.departmentId,
    this.categoryId,
    this.collectionId,
    this.brandId,
    this.filterType,
    required this.title,
  });

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  @override
  void initState() {
    super.initState();
    // Reset bloc state to clear any previous filter values
    context.read<ProductsBloc>().add(const ResetProducts());
    // Fetch products only once when screen is created
    context.read<ProductsBloc>().add(FetchProducts(
      departmentId: widget.departmentId,
      categoryId: widget.categoryId,
      collectionId: widget.collectionId,
      brandId: widget.brandId,
      filterType: widget.filterType,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return _ProductsScreenView(title: widget.title);
  }
}

class _ProductsScreenView extends StatefulWidget {
  final String title;

  const _ProductsScreenView({required this.title});

  @override
  State<_ProductsScreenView> createState() => _ProductsScreenViewState();
}

class _ProductsScreenViewState extends State<_ProductsScreenView> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    // Load more when near bottom
    if (_isBottom) {
      context.read<ProductsBloc>().add(const LoadMoreProducts());
    }
  }

  bool get _isBottom {
    if (!_scrollController.hasClients) return false;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;
    return currentScroll >= (maxScroll * 0.9);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(56),
        child: SafeArea(
          child: AppHeader(
            showBackButton: true,
            onBackTap: () => context.pop(),
          ),
        ),
      ),
      body: BlocBuilder<ProductsBloc, ProductsState>(
          builder: (context, state) {
            return NestedScrollView(
              controller: _scrollController,
              headerSliverBuilder: (context, innerBoxIsScrolled) {
                return [
                 
                  // Collapsible Title and Filters
                  SliverAppBar(
                    floating: true,
                    snap: true,
                    pinned: false,
                    automaticallyImplyLeading: false,
                    backgroundColor: AppColors.background,
                    surfaceTintColor: Colors.transparent,
                    elevation: 0,
                    toolbarHeight: 0,
                    expandedHeight: _getExpandedHeight(state),
                    flexibleSpace: FlexibleSpaceBar(
                      background: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Products Header (Title and Save Search)
                          ProductsHeader(
                            title: widget.title,
                            itemCount: state.totalDocs,
                            onSaveSearch: () {
                              // TODO: Save search functionality
                            },
                          ),

                          // Filter Bar
                          ProductsFilterBar(
                            selectedSort: state.sortBy == 'oldest' 
                                ? SortOption.oldest 
                                : SortOption.latest,
                            selectedPrice: state.sortPrice == null
                                ? PriceOption.all
                                : state.sortPrice == 'desc' 
                                    ? PriceOption.highToLow 
                                    : PriceOption.lowToHigh,
                            filters: state.filters,
                            selectedAttributes: state.selectedAttributes,
                            minPrice: state.minPrice,
                            maxPrice: state.maxPrice,
                            onSortChanged: (sortOption) {
                              final sortBy = sortOption == SortOption.oldest ? 'oldest' : 'latest';
                              context.read<ProductsBloc>().add(ChangeSortOption(sortBy));
                            },
                            onPriceChanged: (priceOption) {
                              final sortPrice = priceOption == PriceOption.all 
                                  ? null 
                                  : priceOption == PriceOption.highToLow 
                                      ? 'desc' 
                                      : 'asc';
                              context.read<ProductsBloc>().add(ChangePriceSort(sortPrice));
                            },
                            onAttributeFilterChanged: (attributeId, optionIds) {
                              context.read<ProductsBloc>().add(
                                ChangeAttributeFilter(
                                  attributeId: attributeId,
                                  optionIds: optionIds,
                                ),
                              );
                            },
                            onPriceRangeChanged: (min, max) {
                              context.read<ProductsBloc>().add(
                                ChangePriceRange(
                                  minPrice: min,
                                  maxPrice: max,
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ];
              },
              body: _buildBody(state),
            );
          },
        ),
    );
  }

  double _getExpandedHeight(ProductsState state) {
    // Base height for ProductsHeader + FilterBar
    // Adjust based on your actual widget heights
    return 120.0;
  }

  Widget _buildBody(ProductsState state) {
    if (state.status == ProductsStatus.loading) {
      return Padding(
        padding: const EdgeInsets.only(top: 15),
        child: GridView.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.55,
            crossAxisSpacing: 10,
            mainAxisSpacing: 20,
          ),
          itemCount: 6,
          itemBuilder: (context, index) {
            return const ProductCardSkeleton();
          },
        ),
      );
    }

    if (state.status == ProductsStatus.failure) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              AppLocalizations.of(context)!.failedToLoadProducts,
              style: AppTypography.bodyL,
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () {
                context.read<ProductsBloc>().add(const RefreshProducts());
              },
              child: Text(AppLocalizations.of(context)!.retry),
            ),
          ],
        ),
      );
    }

    if (state.products.isEmpty) {
      return const ProductsEmptyState();
    }

    return RefreshIndicator(
      onRefresh: () async {
        context.read<ProductsBloc>().add(const RefreshProducts());
        await Future.delayed(const Duration(milliseconds: 500));
      },
      child: GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.5,
        ),
        itemCount: state.products.length +
            (state.status == ProductsStatus.loadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= state.products.length) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          final product = state.products[index];
          return ProductCard(
            id: product.id,
            thumbnail: product.thumbnail,
            brand: product.brand ?? '',
            category: product.category ?? '',
            title: product.title,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            currencyCode: CurrencyUtils.currentCode,
            currencySymbol: CurrencyUtils.currentSymbol,
            slug: product.slug,
            isFavorited: false,
            isBoosted: product.isBoosted,
            showLeftBorder: index % 2 == 0,
            showTopBorder: index < 2,
            sellerId: product.sellerId,
            onFavoriteToggle: (id, isFavorited) {
              // TODO: Toggle favorite
            },
          );
        },
      ),
    );
  }
}
