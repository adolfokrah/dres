import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/features/profile/data/models/product_style_model.dart';
import 'package:dres/features/profile/logic/user_products_bloc/user_products_bloc.dart';

enum ProductViewMode { list, grid }

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
  ProductViewMode _viewMode = ProductViewMode.list;

  @override
  void initState() {
    super.initState();
    _userProductsBloc = getIt<UserProductsBloc>();
    
    // Fetch products if not already loaded
    if (_userProductsBloc.state.status == UserProductsStatus.initial) {
      _userProductsBloc.add(const UserProductsFetchRequested());
    }
  }

  @override
  void dispose() {
    super.dispose();
  }

  void _onScroll(ScrollNotification notification) {
    if (notification is ScrollEndNotification) {
      final metrics = notification.metrics;
      if (metrics.pixels >= metrics.maxScrollExtent - 200) {
        _userProductsBloc.add(const UserProductsLoadMoreRequested());
      }
    }
  }

  void _toggleViewMode() {
    setState(() {
      _viewMode = _viewMode == ProductViewMode.list 
          ? ProductViewMode.grid 
          : ProductViewMode.list;
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<UserProductsBloc, UserProductsState>(
      bloc: _userProductsBloc,
      builder: (context, state) {
        return NotificationListener<ScrollNotification>(
          onNotification: (notification) {
            _onScroll(notification);
            return false; // Allow notification to bubble up to NestedScrollView
          },
          child: CustomScrollView(
            slivers: [
              // Overlap injector for nested scroll view
              SliverOverlapInjector(
                handle: NestedScrollView.sliverOverlapAbsorberHandleFor(
                  widget.parentContext,
                ),
              ),

              // View mode toggle header
              if (state.status == UserProductsStatus.success && state.products.isNotEmpty)
                SliverToBoxAdapter(
                  child: _buildViewModeHeader(state.products.length),
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

            // Products list or grid
            if (state.products.isNotEmpty)
              _viewMode == ProductViewMode.list
                  ? _buildListView(state)
                  : _buildGridView(state),
            ],
          ),
        );
      },
    );
  }

  Widget _buildViewModeHeader(int productCount) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.secondary, width: 1),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            '$productCount product${productCount != 1 ? 's' : ''}',
            style: AppTypography.bodyM.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          Row(
            children: [
              GestureDetector(
                onTap: () {
                  if (_viewMode != ProductViewMode.list) _toggleViewMode();
                },
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _viewMode == ProductViewMode.list 
                        ? AppColors.primary 
                        : Colors.transparent,
                  ),
                  child: PhosphorIcon(
                    PhosphorIcons.list(),
                    size: 18,
                    color: _viewMode == ProductViewMode.list 
                        ? AppColors.textOnPrimary 
                        : AppColors.textSecondary,
                  ),
                ),
              ),
              const SizedBox(width: 4),
              GestureDetector(
                onTap: () {
                  if (_viewMode != ProductViewMode.grid) _toggleViewMode();
                },
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _viewMode == ProductViewMode.grid 
                        ? AppColors.primary 
                        : Colors.transparent,
                  ),
                  child: PhosphorIcon(
                    PhosphorIcons.squaresFour(),
                    size: 18,
                    color: _viewMode == ProductViewMode.grid 
                        ? AppColors.textOnPrimary 
                        : AppColors.textSecondary,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildListView(UserProductsState state) {
    return SliverList(
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
          return Dismissible(
            key: Key(product.id),
            direction: DismissDirection.endToStart,
            background: Container(
              color: AppColors.error,
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.only(right: 20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  PhosphorIcon(
                    PhosphorIcons.archive(),
                    color: Colors.white,
                    size: 24,
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Archive',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            confirmDismiss: (direction) async {
              return await _showArchiveConfirmation(
                context,
                product.title.isNotEmpty ? product.title : 'Untitled',
              );
            },
            onDismissed: (direction) {
              _userProductsBloc.add(
                UserProductsArchiveRequested(styleId: product.id),
              );
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Product archived'),
                  backgroundColor: AppColors.success,
                ),
              );
            },
            child: _ProductTile(
              product: product,
              onTap: () => _onProductTap(product),
            ),
          );
        },
        childCount: state.products.length + (state.hasMore ? 1 : 0),
      ),
    );
  }

  Widget _buildGridView(UserProductsState state) {
    return SliverPadding(
      padding: const EdgeInsets.all(16),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.65,
          crossAxisSpacing: 10,
          mainAxisSpacing: 4,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            if (index >= state.products.length) {
              // Loading more indicator
              return const Center(child: CircularProgressIndicator());
            }

            final product = state.products[index];
            final isLeftColumn = index % 2 == 0;
            final isTopRow = index < 2;
            return _ProductGridTile(
              product: product,
              onTap: () => _onProductTap(product),
              onLongPress: () => _showArchiveDialog(product),
              showLeftBorder: isLeftColumn,
              showTopBorder: isTopRow,
            );
          },
          childCount: state.products.length + (state.hasMore ? 1 : 0),
        ),
      ),
    );
  }

  void _showArchiveDialog(ProductStyleModel product) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
        backgroundColor: AppColors.surface,
        title: Text(
          'Archive Product',
          style: AppTypography.titleLM.copyWith(color: AppColors.textPrimary),
        ),
        content: Text(
          'Are you sure you want to archive "${product.title.isNotEmpty ? product.title : 'Untitled'}"?',
          style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: Text(
              'Cancel',
              style: AppTypography.bodyM.copyWith(color: AppColors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              _userProductsBloc.add(
                UserProductsArchiveRequested(styleId: product.id),
              );
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Product archived'),
                  backgroundColor: AppColors.success,
                ),
              );
            },
            child: Text(
              'Archive',
              style: AppTypography.bodyM.copyWith(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }

  void _onProductTap(ProductStyleModel product) {
    // Navigate to style details screen for editing
    context.push('/sell/style/${product.id}');
  }

  Future<bool?> _showArchiveConfirmation(BuildContext dialogContext, String title) {
    return showDialog<bool>(
      context: dialogContext,
      builder: (context) => AlertDialog(
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
        backgroundColor: AppColors.surface,
        title: Text(
          'Archive Product',
          style: AppTypography.titleLM.copyWith(color: AppColors.textPrimary),
        ),
        content: Text(
          'Are you sure you want to archive "$title"? You will no longer see this product in your list.',
          style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(
              'Cancel',
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(
              'Archive',
              style: AppTypography.bodyM.copyWith(
                color: AppColors.error,
              ),
            ),
          ),
        ],
      ),
    );
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
                      fit: BoxFit.contain,
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
                    style: AppTypography.bodyL.copyWith(
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
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                  ],

                  // Variations count
                  Text(
                    '${product.variationCount} variation${product.variationCount != 1 ? 's' : ''}',
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textHint,
                    ),
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
                    CurrencyUtils.format(product.lowestPrice!),
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

/// Grid tile for product display
class _ProductGridTile extends StatelessWidget {
  final ProductStyleModel product;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final bool showLeftBorder;
  final bool showTopBorder;

  const _ProductGridTile({
    required this.product,
    this.onTap,
    this.onLongPress,
    this.showLeftBorder = true,
    this.showTopBorder = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
      child: Container(
        color: AppColors.surface,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image - takes available space
            Expanded(
              flex: 3,
              child: Container(
                width: double.infinity,
                color: AppColors.secondary,
                child: product.thumbnail != null
                    ? CachedNetworkImage(
                        imageUrl: product.thumbnail!,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const Center(
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        errorWidget: (context, url, error) => Icon(
                          PhosphorIcons.image(),
                          color: AppColors.textHint,
                          size: 32,
                        ),
                      )
                    : Center(
                        child: Icon(
                          PhosphorIcons.image(),
                          color: AppColors.textHint,
                          size: 32,
                        ),
                      ),
              ),
            ),

            // Product info
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
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

                  // Brand
                  if (product.brandName != null)
                    Text(
                      product.brandName!,
                      style: AppTypography.bodyS.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),

                  // Variations count
                  Text(
                    '${product.variationCount} variation${product.variationCount != 1 ? 's' : ''}',
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.textHint,
                    ),
                  ),

                  // Price
                  if (product.lowestPrice != null)
                    Text(
                      CurrencyUtils.format(product.lowestPrice!),
                      style: AppTypography.bodyM.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
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
}
