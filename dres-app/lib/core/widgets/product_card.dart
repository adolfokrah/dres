import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../utilities/media_utils.dart';
import 'package:dres/l10n/app_localizations.dart';

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
  final bool isFavorited;
  final Function(String id, bool isFavorited)? onFavoriteToggle;
  final bool showLeftBorder;
  final bool showTopBorder;
  final bool isBoosted;

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
    this.isFavorited = false,
    this.onFavoriteToggle,
    this.showLeftBorder = true,
    this.showTopBorder = true,
    this.isBoosted = false,
  });

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  bool get _isFavorited => widget.isFavorited;

  void _handleFavoriteToggle() {
    widget.onFavoriteToggle?.call(widget.id, !_isFavorited);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return GestureDetector(
      onTap: () {
        // Navigate to product detail page
        // Navigator.pushNamed(context, '/products/${widget.slug}');
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
              aspectRatio: 1,
              child: Stack(
                children: [
                  Container(
                    color: Colors.white,
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
                  // WE LOVE tag
                  if (widget.isBoosted) 
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                      ),
                      child: Text(
                        l10n.weLove,
                        style: AppTypography.bodyXS.copyWith(
                          color: AppColors.textOnPrimary,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                          fontSize: 10,
                        ),
                      ),
                    ),
                    if(!widget.isBoosted)
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
                            style: AppTypography.bodyL.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        GestureDetector(
                          onTap: _handleFavoriteToggle,
                          child: Icon(
                            _isFavorited ? Icons.favorite : Icons.favorite_border,
                            color: _isFavorited ? Colors.red : AppColors.textPrimary,
                            size: 22,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                  ],
                  // Category
                  if (widget.category != null) ...[
                    Text(
                      widget.category!,
                      style: AppTypography.bodyL.copyWith(
                        color: AppColors.primary,
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
                    style: AppTypography.bodyL.copyWith(
                       fontWeight: FontWeight.w500
                    ),
                    maxLines: 2,
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
