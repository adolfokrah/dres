import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/core/widgets/profile_avatar.dart';
import 'package:dres/features/orders/data/models/order_model.dart';
import 'package:dres/features/orders/presentation/widgets/order_item_tile.dart';

/// Card showing a seller's items in an order with fees and totals
class OrderSellerCard extends StatelessWidget {
  final OrderSellerModel seller;
  final List<OrderItemModel> items;
  final VoidCallback? onLearnMoreTap;
  final void Function(OrderItemModel item)? onReturnItemTap;

  const OrderSellerCard({
    super.key,
    required this.seller,
    required this.items,
    this.onLearnMoreTap,
    this.onReturnItemTap,
  });

  double get _shippingFee {
    // One shipping fee per seller (from first item)
    return items.isNotEmpty ? items.first.shippingFee : 0;
  }

  double get _buyerProtectionFee {
    return items.fold(0.0, (sum, item) => sum + item.buyerProtectionFee);
  }

  double get _itemsTotal {
    return items.fold(0.0, (sum, item) => sum + item.itemTotal);
  }

  double get _total => _itemsTotal + _shippingFee + _buyerProtectionFee;

  /// Get seller display name from first item (stored at purchase time)
  String get _sellerDisplayName {
    if (items.isNotEmpty) {
      return items.first.displaySellerName;
    }
    return seller.displayName;
  }

  /// Get seller image from first item (stored at purchase time)
  String? get _sellerImage {
    if (items.isNotEmpty) {
      return items.first.displaySellerImage;
    }
    return seller.resolvedProfilePhoto;
  }

  @override
  Widget build(BuildContext context) {
    final sellerPhotoUrl = _sellerImage;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: AppColors.background,
        border: Border(
          bottom: BorderSide(color: AppColors.secondary, width: 1),
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
                displayName: _sellerDisplayName,
                size: 57,
              ),
              const SizedBox(width: 7),
              // Seller info
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _sellerDisplayName,
                    style: AppTypography.bodyL.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                  if (seller.isTrustedSeller)
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

          // Items with action buttons for delivered items
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 13),
              child: OrderItemTile(
                item: item,
                onReturnItemTap: onReturnItemTap,
              ),
            ),
          ),

          // Fees section
          _FeeRow(
            icon: PhosphorIcons.truck(),
            label: 'Direct shipping',
            amount: _shippingFee,
          ),
          const SizedBox(height: 14),
          _FeeRow(
            icon: PhosphorIcons.shield(),
            label: 'Buyer protection fee',
            amount: _buyerProtectionFee,
          ),

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
            Icon(icon, size: 14, color: AppColors.textPrimary),
            const SizedBox(width: 9),
            Text(
              label,
              style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
            ),
          ],
        ),
        Text(
          CurrencyUtils.format(amount),
          style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
        ),
      ],
    );
  }
}
