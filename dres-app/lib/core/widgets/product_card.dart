import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../utilities/media_utils.dart';
import 'package:dres/l10n/app_localizations.dart';
import 'package:dres/core/widgets/badge_widget.dart';
import 'package:dres/core/widgets/favorite_button.dart';
import 'package:dres/core/widgets/low_stock_indicator.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';

class ProductCard extends StatefulWidget {
  final String id;
  final String? thumbnail;
  final String? brand;
  final String? category;
  final String title;
  final double price;
  final double? compareAtPrice;
  final String currencyCode;
  final String currencySymbol;
  final String slug;
  final String? defaultSku;
  final bool isFavorited;
  final Function(String id, bool isFavorited)? onFavoriteToggle;
  final bool showLeftBorder;
  final bool showTopBorder;
  final bool isBoosted;
  /// Whether to show the "We Love" badge (only for Standard/Premium tiers)
  final bool showWeLoveBadge;
  /// Seller ID - if matches current user, hides favorite button
  final String? sellerId;
  /// Total stock quantity across all SKUs
  final int? totalStock;

  const ProductCard({
    super.key,
    required this.id,
    this.thumbnail,
    this.brand,
    this.category,
    required this.title,
    required this.price,
    this.compareAtPrice,
    required this.currencyCode,
    required this.currencySymbol,
    required this.slug,
    this.defaultSku,
    this.isFavorited = false,
    this.onFavoriteToggle,
    this.showLeftBorder = true,
    this.showTopBorder = true,
    this.isBoosted = false,
    this.showWeLoveBadge = false,
    this.sellerId,
    this.totalStock,
  });

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  /// Check if the current user is the seller of this item
  bool get _isOwnItem {
    final currentUserId = getIt<AuthBloc>().state.user?.id;
    return widget.sellerId != null && 
           currentUserId != null && 
           widget.sellerId == currentUserId;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return GestureDetector(
      onTap: () {
        // Navigate to product detail page
        final skuParam = widget.defaultSku != null ? '?skuId=${widget.defaultSku}' : '';
        context.push('/products/${widget.id}$skuParam');
      },
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border(
            left: widget.showLeftBorder 
                ? BorderSide(color: AppColors.primary.withValues(alpha: 0.4), width: 1)
                : BorderSide.none,
            right:  BorderSide(color: AppColors.primary.withValues(alpha: 0.4), width: 1),
            top: widget.showTopBorder
                ? BorderSide(color: AppColors.primary.withValues(alpha: 0.4), width: 1)
                : BorderSide.none,
            bottom:  BorderSide(color: AppColors.primary.withValues(alpha: 0.4), width: 1),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Container
            AspectRatio(
              aspectRatio: 1.1,
              child: Stack(
                children: [
                  Container(
                    color: Colors.white,
                    padding: EdgeInsets.all(5),
                    child: widget.thumbnail != null
                        ? Center(
                          child: Image.network(
                               MediaUtils.resolveUrl(widget.thumbnail) ?? '',
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) {
                                return Center(
                                  child: Text(
                                    'No Image',
                                    style: AppTypography.bodyS.copyWith(color: AppColors.textHint),
                                  ),
                                );
                              },
                            ),
                        )
                        : Center(
                            child: Text(
                              'No Image',
                              style: AppTypography.bodyS.copyWith(color: AppColors.textHint),
                            ),
                          ),
                  ),
                
                ],
              ),
            ),
            // Content Container
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                      // Low stock indicator
                  if (LowStockIndicator.isLowStock(widget.totalStock))
                    LowStockIndicator(stock: widget.totalStock!),
                  // WE LOVE tag - only shown for Standard/Premium tiers
                  if (widget.showWeLoveBadge) 
                    BadgeWidget(
                      text: l10n.weLove,
                      backgroundColor: AppColors.primary,
                      borderColor: AppColors.primary,
                      textColor: AppColors.textOnPrimary,
                    ),
                    if(!widget.showWeLoveBadge)
                    const SizedBox(height: 15),

                    const SizedBox(height: 4),
                  // Brand with favorite icon
                  if (widget.brand != null) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          child: Text(
                            widget.brand!.toUpperCase(),
                            style: AppTypography.bodyM.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        // Hide favorite button if user is the seller
                        if (!_isOwnItem)
                          FavoriteButton(
                            variationId: widget.id,
                            size: 22,
                            onChanged: (isFavorited) {
                              widget.onFavoriteToggle?.call(widget.id, isFavorited);
                            },
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                  ],
                  // Category
                  if (widget.category != null) ...[
                    Text(
                      widget.category!,
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.primary.withValues(alpha: 0.7),
                        fontWeight: FontWeight.w500
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                  ],
                  // Title
                  Text(
                    widget.title,
                    style: AppTypography.bodyM.copyWith(
                       fontWeight: FontWeight.w500,
                       color: AppColors.textPrimary.withValues(alpha: 0.7),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const Spacer(),
                  // Price
                  if (widget.compareAtPrice != null &&
                      widget.compareAtPrice! > widget.price) ...[
                    Text(
                      '${widget.currencySymbol} ${widget.compareAtPrice!.toStringAsFixed(2)}',
                      style: AppTypography.bodyL.copyWith(
                        color: AppColors.textHint,
                        decoration: TextDecoration.lineThrough,
                         fontWeight: FontWeight.w500
                      ),
                    ),
                    const SizedBox(height: 4),
                  ],
                  // Actual price
                  Text(
                    '${widget.currencySymbol} ${widget.price.toStringAsFixed(2)}',
                    style: AppTypography.bodyL.copyWith(
                      fontWeight: FontWeight.w600,
                      color: widget.compareAtPrice != null &&
                              widget.compareAtPrice! > widget.price
                          ? Colors.red
                          : AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            ),
          ],
        ),
      ),
    );
  }
}
