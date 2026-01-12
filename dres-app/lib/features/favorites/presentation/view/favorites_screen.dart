import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/widgets/product_card.dart';
import 'package:dres/core/widgets/product_card_skeleton.dart';
import 'package:dres/features/favorites/logic/favorites_bloc/favorites_bloc.dart';
import 'package:dres/features/shop/presentation/widgets/products_filter_bar.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  late final FavoritesBloc _favoritesBloc;
  final ScrollController _scrollController = ScrollController();

  // Filter state
  SortOption _selectedSort = SortOption.latest;
  PriceOption _selectedPrice = PriceOption.all;
  double? _minPrice;
  double? _maxPrice;

  @override
  void initState() {
    super.initState();
    _favoritesBloc = getIt<FavoritesBloc>();
    _favoritesBloc.add(const FavoritesFetchRequested());

    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _favoritesBloc.add(const FavoritesLoadMoreRequested());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: BlocBuilder<FavoritesBloc, FavoritesState>(
          bloc: _favoritesBloc,
          builder: (context, state) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // App Header
                UnifiedHeader.search(),

                // Title Header
                _buildTitleHeader(state),

                // Filter Bar
                ProductsFilterBar(
                  selectedSort: _selectedSort,
                  selectedPrice: _selectedPrice,
                  minPrice: _minPrice,
                  maxPrice: _maxPrice,
                  filters: const [], // No attribute filters for favorites
                  selectedAttributes: const {},
                  onSortChanged: (sort) {
                    setState(() {
                      _selectedSort = sort;
                    });
                  },
                  onPriceChanged: (price) {
                    setState(() {
                      _selectedPrice = price;
                    });
                  },
                  onPriceRangeChanged: (min, max) {
                    setState(() {
                      _minPrice = min;
                      _maxPrice = max;
                    });
                  },
                ),

                // Content
                Expanded(child: _buildContent(state)),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildTitleHeader(FavoritesState state) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'FAVOURITES',
            style: AppTypography.bodyL.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            state.itemCountDisplay,
            style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(FavoritesState state) {
    if (state.status == FavoritesStatus.loading && state.items.isEmpty) {
      return _buildLoadingGrid();
    }

    if (state.status == FavoritesStatus.error && state.items.isEmpty) {
      return _buildErrorState(state.error);
    }

    if (state.items.isEmpty) {
      return _buildEmptyState();
    }

    // Filter and sort items locally based on filter state
    var filteredItems = List.of(state.items);

    // Apply price range filter
    if (_minPrice != null || _maxPrice != null) {
      filteredItems = filteredItems.where((item) {
        if (_minPrice != null && item.price < _minPrice!) {
          return false;
        }
        if (_maxPrice != null && item.price > _maxPrice!) {
          return false;
        }
        return true;
      }).toList();
    }

    // Apply sort
    if (_selectedSort == SortOption.oldest) {
      filteredItems.sort((a, b) => a.favoritedAt.compareTo(b.favoritedAt));
    } else {
      filteredItems.sort((a, b) => b.favoritedAt.compareTo(a.favoritedAt));
    }

    // Apply price sort
    if (_selectedPrice == PriceOption.lowToHigh) {
      filteredItems.sort((a, b) => a.price.compareTo(b.price));
    } else if (_selectedPrice == PriceOption.highToLow) {
      filteredItems.sort((a, b) => b.price.compareTo(a.price));
    }

    // Show empty state if all items filtered out
    if (filteredItems.isEmpty) {
      return _buildNoResultsState();
    }

    return RefreshIndicator(
      onRefresh: () async {
        _favoritesBloc.add(const FavoritesRefreshRequested());
      },
      child: GridView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(0),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.48,
        ),
        itemCount: filteredItems.length + (state.hasMore ? 2 : 0),
        itemBuilder: (context, index) {
          if (index >= filteredItems.length) {
            return const ProductCardSkeleton();
          }

          final item = filteredItems[index];
          final isLeftColumn = index % 2 == 0;

          return ProductCard(
            id: item.id,
            thumbnail: item.thumbnail,
            brand: item.brand,
            category: item.category,
            title: item.title,
            price: item.price,
            compareAtPrice: item.compareAtPrice,
            currencyCode: item.currencyCode,
            currencySymbol: item.currencySymbol,
            slug: item.slug,
            defaultSku: item.defaultSku,
            isFavorited: true, // Always true since this is favorites list
            showLeftBorder: isLeftColumn,
            showTopBorder: index < 2,
            isBoosted: item.isBoosted,
            showWeLoveBadge: item.showWeLoveBadge,
            sellerId: item.sellerId,
            onFavoriteToggle: (id, isFavorited) {
              if (!isFavorited) {
                // Remove from favorites
                _favoritesBloc.add(
                  FavoritesItemRemoved(
                    favoriteId: item.favoriteId,
                    variationId: item.id,
                  ),
                );
              }
            },
          );
        },
      ),
    );
  }

  Widget _buildLoadingGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(0),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.48,
      ),
      itemCount: 6,
      itemBuilder: (context, index) {
        return const ProductCardSkeleton();
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(PhosphorIcons.heart(), size: 64, color: AppColors.textHint),
          const SizedBox(height: 16),
          Text(
            'No favourites yet',
            style: AppTypography.bodyL.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start adding items you love',
            style: AppTypography.bodyM.copyWith(color: AppColors.textHint),
          ),
        ],
      ),
    );
  }

  Widget _buildNoResultsState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            PhosphorIcons.funnelSimple(),
            size: 64,
            color: AppColors.textHint,
          ),
          const SizedBox(height: 16),
          Text(
            'No items match your filters',
            style: AppTypography.bodyL.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Try adjusting your price range',
            style: AppTypography.bodyM.copyWith(color: AppColors.textHint),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () {
              setState(() {
                _minPrice = null;
                _maxPrice = null;
                _selectedPrice = PriceOption.all;
              });
            },
            child: const Text('Clear filters'),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String? error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(PhosphorIcons.warning(), size: 48, color: AppColors.textHint),
            const SizedBox(height: 16),
            Text(
              'Failed to load favourites',
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () =>
                  _favoritesBloc.add(const FavoritesFetchRequested()),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
