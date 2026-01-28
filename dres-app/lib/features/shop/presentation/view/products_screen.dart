import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/widgets/product_card.dart';
import 'package:dres/core/widgets/product_card_skeleton.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/features/shop/logic/products_bloc/products_bloc.dart';
import 'package:dres/features/shop/logic/products_bloc/products_event.dart';
import 'package:dres/features/shop/logic/products_bloc/products_state.dart';
import 'package:dres/features/shop/presentation/widgets/products_header.dart';
import 'package:dres/features/shop/presentation/widgets/products_filter_bar.dart';
import 'package:dres/features/shop/presentation/widgets/products_empty_state.dart';
import 'package:dres/features/saved_searches/logic/saved_searches_bloc/saved_searches_bloc.dart';
import 'package:dres/features/saved_searches/presentation/widgets/save_search_dialog.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:dres/core/services/storage_service.dart';
import 'package:dres/l10n/app_localizations.dart';

class ProductsScreen extends StatefulWidget {
  final String? query;
  final String? departmentId;
  final String? categoryId;
  final String? collectionId;
  final String? styleId;
  final String? brandId;
  final String? filterType; // 'new-arrivals', 'featured', 'trending', 'on-sale'
  final String title;

  const ProductsScreen({
    super.key,
    this.query,
    this.departmentId,
    this.categoryId,
    this.collectionId,
    this.styleId,
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
    // Use provided departmentId or fall back to user's saved preference
    final departmentId = widget.departmentId ?? getIt<StorageService>().getUserDepartment();
    // Fetch products only once when screen is created
    context.read<ProductsBloc>().add(
      FetchProducts(
        query: widget.query,
        departmentId: departmentId,
        categoryId: widget.categoryId,
        collectionId: widget.collectionId,
        styleId: widget.styleId,
        brandId: widget.brandId,
        filterType: widget.filterType,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: getIt<SavedSearchesBloc>(),
      child: _ProductsScreenView(
        query: widget.query,
        departmentId: widget.departmentId,
        categoryId: widget.categoryId,
        collectionId: widget.collectionId,
        styleId: widget.styleId,
        brandId: widget.brandId,
        filterType: widget.filterType,
        title: widget.title,
      ),
    );
  }
}

class _ProductsScreenView extends StatefulWidget {
  final String? query;
  final String? departmentId;
  final String? categoryId;
  final String? collectionId;
  final String? styleId;
  final String? brandId;
  final String? filterType;
  final String title;

  const _ProductsScreenView({
    required this.title,
    this.query,
    this.departmentId,
    this.categoryId,
    this.collectionId,
    this.styleId,
    this.brandId,
    this.filterType,
  });

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
          child: UnifiedHeader.simple(
            title: widget.title,
            showSearchIcon: true,
            onBackTap: () {
              if (context.canPop()) {
                context.pop();
              } else {
                context.go('/home');
              }
            },
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
                        BlocBuilder<SavedSearchesBloc, SavedSearchesState>(
                          bloc: getIt<SavedSearchesBloc>(),
                          builder: (context, savedSearchesState) {
                            final isSearchSaved = _isCurrentSearchSaved(state, savedSearchesState);
                            return ProductsHeader(
                              title: widget.title,
                              itemCount: state.totalDocs,
                              isSearchSaved: isSearchSaved,
                              onSaveSearch: isSearchSaved 
                                  ? null  // Disable tap when already saved
                                  : () => _showSaveSearchDialog(state),
                            );
                          },
                        ),

                        // Filter Bar
                        BlocBuilder<AuthBloc, AuthState>(
                          bloc: getIt<AuthBloc>(),
                          builder: (context, authState) {
                            final userCountryId = authState.user?.country?.id;
                            return ProductsFilterBar(
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
                              selectedShippingCities: state.shippingTo,
                              userCountryId: userCountryId,
                              onSortChanged: (sortOption) {
                                final sortBy = sortOption == SortOption.oldest
                                    ? 'oldest'
                                    : 'latest';
                                context.read<ProductsBloc>().add(
                                  ChangeSortOption(sortBy),
                                );
                              },
                              onPriceChanged: (priceOption) {
                                final sortPrice = priceOption == PriceOption.all
                                    ? null
                                    : priceOption == PriceOption.highToLow
                                    ? 'desc'
                                    : 'asc';
                                context.read<ProductsBloc>().add(
                                  ChangePriceSort(sortPrice),
                                );
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
                                  ChangePriceRange(minPrice: min, maxPrice: max),
                                );
                              },
                              onShippingToChanged: (cityIds) {
                                context.read<ProductsBloc>().add(
                                  ChangeShippingToFilter(cityIds),
                                );
                              },
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
          childAspectRatio: 0.58,
        ),
        itemCount:
            state.products.length +
            (state.status == ProductsStatus.loadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= state.products.length) {
            return const Center(child: CircularProgressIndicator());
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
            showWeLoveBadge: product.showWeLoveBadge,
            showLeftBorder: index % 2 == 0,
            showTopBorder: index < 2,
            sellerId: product.sellerId,
            totalStock: product.totalStock,
            onFavoriteToggle: (id, isFavorited) {
              // TODO: Toggle favorite
            },
          );
        },
      ),
    );
  }

  void _showSaveSearchDialog(ProductsState state) {
    print('🔍 Save search tapped - building search data...');
    
    // Build search data from current filters and parameters
    final searchData = <String, dynamic>{
      // Basic search info
      if (widget.query != null) 'query': widget.query,
      if (widget.departmentId != null) 'departmentId': widget.departmentId,
      if (widget.categoryId != null) 'categoryId': widget.categoryId,
      if (widget.collectionId != null) 'collectionId': widget.collectionId,
      if (widget.brandId != null) 'brandId': widget.brandId,
      if (widget.filterType != null) 'filterType': widget.filterType,
      
      // Use the title as names for now (we can improve this later)
      if (widget.departmentId != null) 'departmentName': widget.title,
      if (widget.categoryId != null) 'categoryName': widget.title,
      if (widget.collectionId != null) 'collectionName': widget.title,
      if (widget.brandId != null) 'brandName': widget.title,
      
      // Current filters from state
      if (state.sortBy != null) 'sortBy': state.sortBy,
      if (state.sortPrice != null) 'sortPrice': state.sortPrice,
      if (state.minPrice != null) 'minPrice': state.minPrice,
      if (state.maxPrice != null) 'maxPrice': state.maxPrice,
      if (state.selectedAttributes.isNotEmpty) 'selectedAttributes': state.selectedAttributes,
    };

    print('📋 Search data: $searchData');

    // Generate a suggested name based on the search
    String? suggestedName = _generateSearchName(state);
    print('💡 Suggested name: $suggestedName');

    showSaveSearchDialog(
      context,
      searchData: searchData,
      suggestedName: suggestedName,
    );
  }

  String? _generateSearchName(ProductsState state) {
    final parts = <String>[];
    
    // Use widget title as a base
    parts.add(widget.title);
    
    if (state.maxPrice != null) {
      parts.add('Under \$${state.maxPrice!.toInt()}');
    } else if (state.minPrice != null) {
      parts.add('Over \$${state.minPrice!.toInt()}');
    }
    
    if (widget.filterType == 'on-sale') {
      parts.add('On Sale');
    } else if (widget.filterType == 'new-arrivals') {
      parts.add('New Arrivals');
    }
    
    return parts.join(' ');
  }

  bool _isCurrentSearchSaved(ProductsState state, SavedSearchesState savedSearchesState) {
    final currentSearchData = {
      if (widget.query != null) 'query': widget.query,
      if (widget.departmentId != null) 'departmentId': widget.departmentId,
      if (widget.categoryId != null) 'categoryId': widget.categoryId,
      if (widget.collectionId != null) 'collectionId': widget.collectionId,
      if (widget.brandId != null) 'brandId': widget.brandId,
      if (widget.filterType != null) 'filterType': widget.filterType,
      if (state.sortBy != null) 'sortBy': state.sortBy,
      if (state.sortPrice != null) 'sortPrice': state.sortPrice,
      if (state.minPrice != null) 'minPrice': state.minPrice,
      if (state.maxPrice != null) 'maxPrice': state.maxPrice,
      if (state.selectedAttributes.isNotEmpty) 'selectedAttributes': state.selectedAttributes,
    };
    
    // Check if any saved search matches current criteria
    return savedSearchesState.searches.any((savedSearch) {
      return _searchDataMatches(savedSearch.searchData, currentSearchData);
    });
  }

  bool _searchDataMatches(Map<String, dynamic> saved, Map<String, dynamic> current) {
    // Compare key search parameters
    final keysToCompare = [
      'query', 'departmentId', 'categoryId', 'collectionId', 'brandId', 
      'filterType', 'sortBy', 'sortPrice', 'minPrice', 'maxPrice'
    ];
    
    for (final key in keysToCompare) {
      if (saved[key] != current[key]) return false;
    }
    
    // For attributes, do a deeper comparison if both exist
    if (saved['selectedAttributes'] != null && current['selectedAttributes'] != null) {
      // Simple string comparison for now - could be made more sophisticated
      return saved['selectedAttributes'].toString() == current['selectedAttributes'].toString();
    }
    
    return saved['selectedAttributes'] == current['selectedAttributes'];
  }
}
