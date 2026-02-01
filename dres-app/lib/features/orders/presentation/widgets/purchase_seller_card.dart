import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/core/widgets/profile_avatar.dart';
import 'package:dres/features/orders/data/models/purchase_details_model.dart';
import 'package:dres/features/orders/presentation/widgets/purchase_item_tile.dart';

/// Card showing a seller's items in a purchase with fees and totals
class PurchaseSellerCard extends StatelessWidget {
  final SellerGroupModel sellerGroup;
  final String orderId;
  final String currencySymbol;
  final String? deliveryPhone;
  final void Function(PurchaseItemModel item)? onReturnItemTap;

  const PurchaseSellerCard({
    super.key,
    required this.sellerGroup,
    required this.orderId,
    required this.currencySymbol,
    this.deliveryPhone,
    this.onReturnItemTap,
  });

  @override
  Widget build(BuildContext context) {
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
                photoUrl: sellerGroup.sellerImage,
                displayName: sellerGroup.sellerName,
                size: 57,
              ),
              const SizedBox(width: 7),
              // Seller info
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    sellerGroup.sellerName,
                    style: AppTypography.bodyL.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                  if (sellerGroup.isTrustedSeller)
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
          ...sellerGroup.items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 13),
              child: PurchaseItemTile(
                item: item,
                currencySymbol: currencySymbol,
                onReturnItemTap: onReturnItemTap,
              ),
            ),
          ),

          // Fees section
          _FeeRow(
            icon: PhosphorIcons.truck(),
            label: 'Direct shipping',
            amount: sellerGroup.shippingFee,
            currencySymbol: currencySymbol,
          ),
          const SizedBox(height: 14),
          _FeeRow(
            icon: PhosphorIcons.shield(),
            label: 'Buyer protection fee',
            amount: sellerGroup.buyerProtectionFee,
            currencySymbol: currencySymbol,
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
                CurrencyUtils.format(sellerGroup.total, symbol: currencySymbol),
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),

          // Delivery code for this seller (show when items are out for delivery)
          if (sellerGroup.hasItemsOutForDelivery && sellerGroup.deliveryCode != null) ...[
            _DeliveryCodeSection(
              code: sellerGroup.deliveryCode!,
              deliveryPhone: deliveryPhone,
            ),
            const SizedBox(height: 16),
          ],
        ],
      ),
    );
  }
}

class _FeeRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final double amount;
  final String currencySymbol;

  const _FeeRow({
    required this.icon,
    required this.label,
    required this.amount,
    required this.currencySymbol,
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
          CurrencyUtils.format(amount, symbol: currencySymbol),
          style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
        ),
      ],
    );
  }
}

/// Delivery code section shown within seller card
class _DeliveryCodeSection extends StatelessWidget {
  final String code;
  final String? deliveryPhone;

  const _DeliveryCodeSection({
    required this.code,
    this.deliveryPhone,
  });

  void _showInstructionsBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.background,
      isScrollControlled: true,
      builder: (context) => _DeliveryPinInstructionsSheet(
        code: code,
        deliveryPhone: deliveryPhone,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showInstructionsBottomSheet(context),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Text(
                  'Your delivery pin',
                  style: AppTypography.bodyL.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(width: 8),
                Icon(
                  PhosphorIcons.info(),
                  size: 16,
                  color: AppColors.textSecondary,
                ),
              ],
            ),
            Row(
              children: code.split('').map((digit) => _DigitBox(digit: digit)).toList(),
            ),
          ],
        ),
      ),
    );
  }
}

/// Individual digit box for delivery pin
class _DigitBox extends StatelessWidget {
  final String digit;

  const _DigitBox({required this.digit});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 30,
      height: 30,
      margin: const EdgeInsets.only(left: 2),
      decoration: BoxDecoration(
        color: AppColors.textPrimary,
        border: Border.all(color: AppColors.textPrimary),
      ),
      child: Center(
        child: Text(
          digit,
          style: AppTypography.bodyL.copyWith(
            color: AppColors.background,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

/// Bottom sheet with delivery PIN instructions for buyers
class _DeliveryPinInstructionsSheet extends StatelessWidget {
  final String code;
  final String? deliveryPhone;

  const _DeliveryPinInstructionsSheet({
    required this.code,
    this.deliveryPhone,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Delivery PIN Instructions',
                  style: AppTypography.titleLM.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Icon(
                    PhosphorIcons.x(),
                    size: 24,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // PIN display
            Center(
              child: Column(
                children: [
                  Text(
                    'Your Delivery PIN',
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: code.split('').map((digit) => Container(
                          width: 48,
                          height: 48,
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          decoration: BoxDecoration(
                            color: AppColors.textPrimary,
                          ),
                          child: Center(
                            child: Text(
                              digit,
                              style: AppTypography.titleL.copyWith(
                                color: AppColors.background,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        )).toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Delivery phone (if available)
            if (deliveryPhone != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.secondary,
                ),
                child: Row(
                  children: [
                    Icon(
                      PhosphorIcons.phone(),
                      size: 20,
                      color: AppColors.textPrimary,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Delivery Phone',
                            style: AppTypography.bodyS.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                          Text(
                            deliveryPhone!,
                            style: AppTypography.bodyL.copyWith(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Instructions
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.secondary,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        PhosphorIcons.info(),
                        size: 20,
                        color: AppColors.textPrimary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'How it works',
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _InstructionStep(
                    number: '1',
                    text: 'When the courier arrives, share this PIN and phone number with them',
                  ),
                  const SizedBox(height: 8),
                  _InstructionStep(
                    number: '2',
                    text: 'The courier will dial *426*130# and enter your PIN',
                  ),
                  const SizedBox(height: 8),
                  _InstructionStep(
                    number: '3',
                    text: 'This confirms delivery and releases payment to the seller',
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

/// Instruction step widget
class _InstructionStep extends StatelessWidget {
  final String number;
  final String text;

  const _InstructionStep({
    required this.number,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            color: AppColors.textPrimary,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              number,
              style: AppTypography.bodyS.copyWith(
                color: AppColors.background,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: AppTypography.bodyM.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}
