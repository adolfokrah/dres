import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/quantity_selector.dart';
import 'package:dres/core/utilities/media_utils.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/features/cart/data/repositories/cart_repository.dart';

class CartItemTile extends StatelessWidget {
  final CartItemModel item;
  final bool isLoading;
  final bool isEditMode;
  final VoidCallback? onDecrement;
  final VoidCallback? onIncrement;
  final VoidCallback? onRemove;

  const CartItemTile({
    super.key,
    required this.item,
    this.isLoading = false,
    this.isEditMode = false,
    this.onDecrement,
    this.onIncrement,
    this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final variation = item.variation;
    final sku = item.sku;

    // Get product image with full URL
    final imageUrl = MediaUtils.resolveUrl(variation?.image);

    // Get prices - red is the actual price, gray strikethrough is compareAtPrice
    final displayPrice = sku?.displayPrice ?? item.price ?? 0;
    final compareAtPrice = sku?.compareAtPrice;
    final hasDiscount = sku?.hasDiscount ?? false;

    // Check availability status
    final isOutOfStock = item.isOutOfStock;
    final isNotInYourCountry = item.isNotInYourCountry;
    final isUnavailable = item.isUnavailable;
    final exceedsStock = item.exceedsAvailableStock;
    final availableStock = item.availableStock;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Delete button on left side in edit mode (always full opacity)
        if (isEditMode)
          GestureDetector(
            onTap: onRemove,
            child: Container(
              width: 23,
              height: 24,
              margin: const EdgeInsets.only(right: 10),
              decoration: const BoxDecoration(
                color: AppColors.error,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Icon(
                  PhosphorIcons.minus(),
                  size: 13,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        // Rest of item content with opacity for unavailable items
        Expanded(
          child: Opacity(
            opacity: isUnavailable ? 0.5 : 1.0,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product image
                Stack(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                  color: AppColors.secondary,
                  image: imageUrl != null
                      ? DecorationImage(
                          image: NetworkImage(imageUrl),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
              ),
              // Unavailable overlay
              if (isUnavailable)
                Container(
                  width: 56,
                  height: 56,
                  color: Colors.black.withOpacity(0.5),
                  alignment: Alignment.center,
                  child: Icon(
                    isNotInYourCountry ? Icons.location_off : Icons.remove_shopping_cart,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 16),

          // Product info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Brand
                Text(
                  variation?.brand ?? 'Brand',
                  style: AppTypography.bodyL.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                // Title
                Text(
                  variation?.title ?? 'Product',
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                // SKU options (e.g., "S" or "W40 L31")
                if (sku?.optionValuesDisplay != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    sku!.optionValuesDisplay!,
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
                const SizedBox(height: 4),
                // Price row
                Row(
                  children: [
                    if (hasDiscount && compareAtPrice != null) ...[
                      // Gray strikethrough = compare at price (original)
                      Text(
                        CurrencyUtils.format(compareAtPrice),
                        style: AppTypography.bodyL.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.textSecondary,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Red = actual selling price
                      Text(
                        CurrencyUtils.format(displayPrice),
                        style: AppTypography.bodyL.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.error,
                        ),
                      ),
                    ] else
                      // No discount - just show price in black
                      Text(
                        CurrencyUtils.format(displayPrice),
                        style: AppTypography.bodyL.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                  ],
                ),
                // Availability warnings
                if (isNotInYourCountry) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Item no longer available in your country',
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.error,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ] else if (isOutOfStock) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Out of stock',
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.error,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ] else if (exceedsStock && availableStock != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Only $availableStock available',
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.warning,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                // Quantity selector (disabled if unavailable)
                if (!isUnavailable)
                  SizedBox(
                    width: 143,
                    child: QuantitySelector(
                      quantity: item.quantity,
                      isLoading: isLoading,
                      maxStock: item.availableStock,
                      onDecrement: onDecrement,
                      onIncrement: onIncrement,
                      height: 44,
                    ),
                  ),
              ],
            ),
          ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
