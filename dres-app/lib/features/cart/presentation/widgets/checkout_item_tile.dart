import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/core/utilities/media_utils.dart';
import 'package:dres/features/cart/data/repositories/cart_repository.dart';

/// Simplified item tile for checkout (no quantity controls)
class CheckoutItemTile extends StatelessWidget {
  final CartItemModel item;

  const CheckoutItemTile({
    super.key,
    required this.item,
  });

  @override
  Widget build(BuildContext context) {
    final variation = item.variation;
    final sku = item.sku;

    // Get product image
    final imageUrl = MediaUtils.resolveUrl(variation?.image);

    // Get price
    final displayPrice = sku?.displayPrice ?? item.price ?? 0;

    // Get SKU option value (e.g., "M", "L", "W40 L31")
    final optionValue = sku?.optionValuesDisplay ?? '';

    // Use per-item validation from backend
    final isValid = item.valid;
    final reason = item.reason;
    final isUnavailable = item.isUnavailable;
    final isNotInYourCountry = item.isNotInYourCountry;

    return Opacity(
      opacity: !isValid ? 0.5 : 1.0,
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
                          fit: BoxFit.contain,
                        )
                      : null,
                ),
              ),
              // Unavailable overlay
              if (!isValid)
                Container(
                  width: 56,
                  height: 56,
                  color: Colors.black.withOpacity(0.5),
                  alignment: Alignment.center,
                  child: PhosphorIcon(
                    isNotInYourCountry ? PhosphorIconsRegular.prohibit : 
                    isUnavailable ? PhosphorIconsRegular.shoppingCartSimple : PhosphorIconsRegular.warning,
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
                  variation?.title?.toUpperCase() ?? 'PRODUCT',
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
               Row(children: [
                  if (optionValue.isNotEmpty) ...[
                  // SKU option value
                  Text(
                    optionValue,
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
                const SizedBox(width: 4),
                // Quantity
                Text(
                  'x ${item.quantity}',
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textSecondary,
                  ),
                )
               ],),
                // Show validation reason from backend
                if (!isValid && reason != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    reason,
                    style: AppTypography.bodyS.copyWith(
                      color: isUnavailable ? AppColors.error : AppColors.warning,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Price
          Text(
            CurrencyUtils.format(displayPrice * item.quantity),
            style: AppTypography.bodyL.copyWith(
              fontWeight: FontWeight.w700,
              color: isUnavailable ? AppColors.textSecondary : AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
