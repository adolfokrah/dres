import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/profile/data/models/product_style_model.dart';
import 'package:dres/features/profile/logic/user_products_bloc/user_products_bloc.dart';

class UserProductsList extends StatefulWidget {
  final BuildContext parentContext;

  const UserProductsList({
    super.key,
    required this.parentContext,
  });

  @override
  State<UserProductsList> createState() => _UserProductsListState();
}

class _UserProductsListState extends State<UserProductsList> {
  late final UserProductsBloc _userProductsBloc;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _userProductsBloc = getIt<UserProductsBloc>();
    
    // Fetch products if not already loaded
    if (_userProductsBloc.state.status == UserProductsStatus.initial) {
      _userProductsBloc.add(const UserProductsFetchRequested());
    }

    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_isBottom) {
      _userProductsBloc.add(const UserProductsLoadMoreRequested());
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
    return BlocBuilder<UserProductsBloc, UserProductsState>(
      bloc: _userProductsBloc,
      builder: (context, state) {
        return CustomScrollView(
          controller: _scrollController,
          slivers: [
            // Overlap injector for nested scroll view
            SliverOverlapInjector(
              handle: NestedScrollView.sliverOverlapAbsorberHandleFor(
                widget.parentContext,
              ),
            ),

            // Loading state
            if (state.status == UserProductsStatus.loading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              ),

            // Error state
            if (state.status == UserProductsStatus.error)
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
                          _userProductsBloc.add(const UserProductsFetchRequested());
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),

            // Empty state
            if (state.status == UserProductsStatus.success &&
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
                        'Your published products will appear here',
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textHint,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // Products list
            if (state.products.isNotEmpty)
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    if (index >= state.products.length) {
                      // Loading more indicator
                      return const Padding(
                        padding: EdgeInsets.all(16),
                        child: Center(child: CircularProgressIndicator()),
                      );
                    }

                    final product = state.products[index];
                    return _ProductTile(
                      product: product,
                      onTap: () => _onProductTap(product),
                    );
                  },
                  childCount:
                      state.products.length + (state.hasMore ? 1 : 0),
                ),
              ),
          ],
        );
      },
    );
  }

  void _onProductTap(ProductStyleModel product) {
    // Navigate to style details screen for editing
    context.push('/sell/style/${product.id}');
  }
}

class _ProductTile extends StatelessWidget {
  final ProductStyleModel product;
  final VoidCallback? onTap;

  const _ProductTile({
    required this.product,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(color: AppColors.secondary, width: 1),
          ),
        ),
        child: Row(
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: product.thumbnail != null
                  ? CachedNetworkImage(
                      imageUrl: product.thumbnail!,
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        width: 60,
                        height: 60,
                        color: AppColors.secondary,
                      ),
                      errorWidget: (context, url, error) => Container(
                        width: 60,
                        height: 60,
                        color: AppColors.secondary,
                        child: const Icon(
                          Icons.image_not_supported_outlined,
                          color: AppColors.textHint,
                        ),
                      ),
                    )
                  : Container(
                      width: 60,
                      height: 60,
                      color: AppColors.secondary,
                      child: const Icon(
                        Icons.image_outlined,
                        color: AppColors.textHint,
                      ),
                    ),
            ),
            const SizedBox(width: 16),

            // Product info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    product.title.isNotEmpty ? product.title : 'Untitled',
                    style: AppTypography.bodyM.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  
                  // Brand
                  if (product.brandName != null) ...[
                    Text(
                      product.brandName!,
                      style: AppTypography.bodyS.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                  ],

                  // Stats row
                  Row(
                    children: [
                      // Variations count
                      Text(
                        '${product.variationCount} variation${product.variationCount != 1 ? 's' : ''}',
                        style: AppTypography.bodyS.copyWith(
                          color: AppColors.textHint,
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Stock
                      Text(
                        '${product.totalStock} in stock',
                        style: AppTypography.bodyS.copyWith(
                          color: product.totalStock > 0 
                              ? AppColors.textHint 
                              : AppColors.error,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Price and arrow
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (product.lowestPrice != null)
                  Text(
                    'GH₵${product.lowestPrice!.toStringAsFixed(2)}',
                    style: AppTypography.bodyM.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                const SizedBox(height: 8),
                Icon(
                  PhosphorIcons.caretRight(),
                  color: AppColors.textHint,
                  size: 16,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
