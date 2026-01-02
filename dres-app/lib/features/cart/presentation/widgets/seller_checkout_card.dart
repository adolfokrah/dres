import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/core/widgets/profile_avatar.dart';
import 'package:dres/features/cart/data/repositories/cart_repository.dart';
import 'package:dres/features/cart/presentation/widgets/checkout_item_tile.dart';

/// Card showing a seller's items in checkout with fees and totals
class SellerCheckoutCard extends StatelessWidget {
  final String sellerName;
  final String? sellerPhotoUrl;
  final bool isTrustedSeller;
  final List<CartItemModel> items;
  final double shippingFee;
  final double buyerProtectionFee;
  final bool hasBuyerProtection;
  final VoidCallback? onLearnMoreTap;

  const SellerCheckoutCard({
    super.key,
    required this.sellerName,
    this.sellerPhotoUrl,
    this.isTrustedSeller = false,
    required this.items,
    required this.shippingFee,
    required this.buyerProtectionFee,
    this.hasBuyerProtection = false,
    this.onLearnMoreTap,
  });

  double get _itemsTotal {
    return items.fold(0.0, (sum, item) {
      final price = item.sku?.displayPrice ?? item.price ?? 0;
      return sum + (price * item.quantity);
    });
  }

  double get _total => _itemsTotal + shippingFee + (hasBuyerProtection ? buyerProtectionFee : 0);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: AppColors.background,
        border: Border(
          bottom: BorderSide(
            color: AppColors.secondary,
            width: 1,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Seller header
          Row(
            children: [
              // Seller avatar
              ProfileAvatar(
                photoUrl: sellerPhotoUrl,
                displayName: sellerName,
                size: 57,
              ),
              const SizedBox(width: 7),
              // Seller info
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    sellerName,
                    style: AppTypography.bodyL.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                  if (isTrustedSeller)
                    Row(
                      children: [
                        Icon(
                          PhosphorIcons.sealCheck(PhosphorIconsStyle.fill),
                          size: 14,
                          color: AppColors.textPrimary,
                        ),
                        const SizedBox(width: 5),
                        Text(
                          'Trusted Seller',
                          style: AppTypography.bodyS.copyWith(
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Cart items
          ...items.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: CheckoutItemTile(item: item),
              )),

          // Fees section
          _FeeRow(
            icon: PhosphorIcons.truck(),
            label: 'Direct shipping',
            amount: shippingFee,
          ),
          const SizedBox(height: 14),

          // Learn more link (for direct shipping info)
          GestureDetector(
            onTap: onLearnMoreTap,
            child: Text(
              'Learn More',
              style: AppTypography.bodyM.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
                decoration: TextDecoration.underline,
              ),
            ),
          ),

          if (hasBuyerProtection) ...[
            const SizedBox(height: 14),
            _FeeRow(
              icon: PhosphorIcons.shield(),
              label: 'Buyer protection fee',
              amount: buyerProtectionFee,
            ),
          ],

          const SizedBox(height: 14),

          // Total row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total',
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                CurrencyUtils.format(_total),
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FeeRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final double amount;

  const _FeeRow({
    required this.icon,
    required this.label,
    required this.amount,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(
              icon,
              size: 14,
              color: AppColors.textPrimary,
            ),
            const SizedBox(width: 9),
            Text(
              label,
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        Text(
          CurrencyUtils.format(amount),
          style: AppTypography.bodyM.copyWith(
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
