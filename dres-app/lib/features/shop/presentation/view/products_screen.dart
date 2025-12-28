import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/widgets/app_header.dart';
import 'package:dres/core/widgets/product_card.dart';
import 'package:dres/features/shop/logic/products_bloc/products_bloc.dart';
import 'package:dres/features/shop/logic/products_bloc/products_event.dart';
import 'package:dres/features/shop/logic/products_bloc/products_state.dart';
import 'package:dres/features/shop/presentation/widgets/products_header.dart';
import 'package:dres/features/shop/presentation/widgets/products_filter_bar.dart';

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

            // Products Header (Title and Save Search)
            BlocBuilder<ProductsBloc, ProductsState>(
              builder: (context, state) {
                return ProductsHeader(
                  title: widget.title,
                  itemCount: state.totalDocs,
                  onSaveSearch: () {
                    // TODO: Save search functionality
                  },
                );
              },
            ),

            // Filter Bar
            BlocBuilder<ProductsBloc, ProductsState>(
              builder: (context, state) {
                return ProductsFilterBar(
                  selectedSort: state.sortBy == 'oldest' 
                      ? SortOption.oldest 
                      : SortOption.latest,
                  selectedPrice: state.sortPrice == 'desc' 
                      ? PriceOption.highToLow 
                      : PriceOption.lowToHigh,
                  onSortChanged: (sortOption) {
                    final sortBy = sortOption == SortOption.oldest ? 'oldest' : 'latest';
                    context.read<ProductsBloc>().add(ChangeSortOption(sortBy));
                  },
                  onPriceChanged: (priceOption) {
                    final sortPrice = priceOption == PriceOption.highToLow ? 'desc' : 'asc';
                    context.read<ProductsBloc>().add(ChangePriceSort(sortPrice));
                  },
                );
              },
            ),

            // Products Grid
            Expanded(
              child: BlocBuilder<ProductsBloc, ProductsState>(
                builder: (context, state) {
                  if (state.status == ProductsStatus.loading) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  if (state.status == ProductsStatus.failure) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Failed to load products',
                            style: AppTypography.bodyL,
                          ),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () {
                              context.read<ProductsBloc>().add(const RefreshProducts());
                            },
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    );
                  }

                  if (state.products.isEmpty) {
                    return Center(
                      child: Text(
                        'No products found',
                        style: AppTypography.bodyL,
                      ),
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async {
                      context.read<ProductsBloc>().add(const RefreshProducts());
                      await Future.delayed(const Duration(milliseconds: 500));
                    },
                    child: CustomScrollView(
                      controller: _scrollController,
                      slivers: [
                        SliverPadding(
                          padding: const EdgeInsets.all(16),
                          sliver: SliverGrid(
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              childAspectRatio: 0.5, // Taller cards to accommodate all content
                            ),
                            delegate: SliverChildBuilderDelegate(
                              (context, index) {
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
                                  currencyCode: 'GHS',
                                  currencySymbol: 'GHS',
                                  slug: product.slug,
                                  isFavorited: false,
                                  isBoosted: product.isBoosted,
                                  showLeftBorder: index % 2 == 0,
                                  showTopBorder: index < 2, // Only show top border for first row (index 0 and 1)
                                  onFavoriteToggle: (id, isFavorited) {
                                    // TODO: Toggle favorite
                                  },
                                );
                              },
                              childCount: state.products.length +
                                  (state.status == ProductsStatus.loadingMore ? 1 : 0),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
