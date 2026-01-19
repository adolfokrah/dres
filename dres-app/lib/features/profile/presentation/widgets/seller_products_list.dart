import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/widgets/product_card.dart';
import 'package:dres/features/profile/logic/seller_products_bloc/seller_products_bloc.dart';

/// Widget to display a seller's products (variations) for visitors
class SellerProductsList extends StatefulWidget {
  final BuildContext parentContext;
  final String sellerId;

  const SellerProductsList({
    super.key,
    required this.parentContext,
    required this.sellerId,
  });

  @override
  State<SellerProductsList> createState() => _SellerProductsListState();
}

class _SellerProductsListState extends State<SellerProductsList> {
  late final SellerProductsBloc _sellerProductsBloc;

  @override
  void initState() {
    super.initState();
    // Create a new BLoC instance for this widget
    _sellerProductsBloc = getIt<SellerProductsBloc>();

    debugPrint('🛍️ SellerProductsList initState for seller: ${widget.sellerId}');
    
    // Always fetch products for this seller
    _sellerProductsBloc.add(SellerProductsFetchRequested(sellerId: widget.sellerId));
  }

  @override
  void dispose() {
    // Close the BLoC since it's a factory instance
    _sellerProductsBloc.close();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    _sellerProductsBloc.add(SellerProductsFetchRequested(sellerId: widget.sellerId));
    // Wait for the state to change from loading
    await _sellerProductsBloc.stream.firstWhere(
      (state) => state.status != SellerProductsStatus.loading,
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SellerProductsBloc, SellerProductsState>(
      bloc: _sellerProductsBloc,
      builder: (context, state) {
        return NotificationListener<ScrollNotification>(
          onNotification: (scrollInfo) {
            if (scrollInfo is ScrollEndNotification) {
              final metrics = scrollInfo.metrics;
              if (metrics.pixels >= metrics.maxScrollExtent * 0.9) {
                _sellerProductsBloc.add(SellerProductsLoadMoreRequested(sellerId: widget.sellerId));
              }
            }
            return false;
          },
          child: RefreshIndicator(
            onRefresh: _onRefresh,
            edgeOffset: 100, // Account for NestedScrollView header
            child: CustomScrollView(
              slivers: [
                // Overlap injector for nested scroll view
                SliverOverlapInjector(
                handle: NestedScrollView.sliverOverlapAbsorberHandleFor(
                  widget.parentContext,
                ),
              ),

            // Loading state
            if (state.status == SellerProductsStatus.loading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              ),

            // Error state
            if (state.status == SellerProductsStatus.error)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        PhosphorIcons.warning(),
                        size: 48,
                        color: AppColors.textHint,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Failed to load products',
                        style: AppTypography.bodyL.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () {
                          _sellerProductsBloc.add(
                            SellerProductsFetchRequested(sellerId: widget.sellerId),
                          );
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),

            // Empty state
            if (state.status == SellerProductsStatus.success &&
                state.products.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        PhosphorIcons.package(),
                        size: 48,
                        color: AppColors.textHint,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No products yet',
                        style: AppTypography.bodyL.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'This seller hasn\'t listed any products',
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textHint,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // Products grid
            if (state.products.isNotEmpty)
              SliverPadding(
                padding: const EdgeInsets.only(top: 20),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.5,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      if (index >= state.products.length) {
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: CircularProgressIndicator(),
                          ),
                        );
                      }

                      final product = state.products[index];
                      final isLeftColumn = index % 2 == 0;
                      final isTopRow = index < 2;
                      
                      return ProductCard(
                        id: product.id,
                        thumbnail: product.thumbnail,
                        brand: product.brandName,
                        title: product.title.isNotEmpty ? product.title : 'Untitled',
                        price: product.lowestPrice ?? 0,
                        currencyCode: 'GHS',
                        currencySymbol: 'GH₵',
                        slug: product.id, // Use ID as slug since we navigate by ID
                        sellerId: widget.sellerId,
                        showLeftBorder: isLeftColumn,
                        showTopBorder: isTopRow,
                      );
                    },
                    childCount: state.products.length + (state.hasMore ? 1 : 0),
                  ),
                ),
              ),
              ],
            ),
          ),
        );
      },
    );
  }
}
