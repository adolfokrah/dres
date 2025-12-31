import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/features/cart/data/models/cart_model.dart';

/// Order summary section with totals breakdown
class OrderSummarySection extends StatefulWidget {
  final int itemCount;
  final double itemsTotal;
  final double discount;
  final double shipping;
  final double buyerProtection;
  final List<CartItemModel> items;

  const OrderSummarySection({
    super.key,
    required this.itemCount,
    required this.itemsTotal,
    required this.discount,
    required this.shipping,
    required this.buyerProtection,
    required this.items,
  });

  @override
  State<OrderSummarySection> createState() => _OrderSummarySectionState();
}

class _OrderSummarySectionState extends State<OrderSummarySection> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      color: AppColors.background,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Items row with chevron
          GestureDetector(
            onTap: () {
              setState(() {
                _isExpanded = !_isExpanded;
              });
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text(
                      '${widget.itemCount} items',
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(width: 4),
                    AnimatedRotation(
                      turns: _isExpanded ? 0.5 : 0,
                      duration: const Duration(milliseconds: 200),
                      child: Icon(
                        Icons.keyboard_arrow_down,
                        size: 20,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                Text(
                  CurrencyUtils.format(widget.itemsTotal),
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          
          // Expandable item summary
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Container(
              margin: const EdgeInsets.only(top: 8),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: widget.items.map((item) {
                  final title = item.variation?.title ?? 'Item';
                  final option = item.sku?.optionValuesDisplay;
                  final qty = item.quantity;
                  
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                title,
                                style: AppTypography.bodyS.copyWith(
                                  color: AppColors.textPrimary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                option != null ? '$option x $qty' : 'x $qty',
                                style: AppTypography.bodyS.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            crossFadeState: _isExpanded 
                ? CrossFadeState.showSecond 
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 200),
          ),
          
          const SizedBox(height: 8),
          _SummaryRow(
            label: 'Discount',
            amount: -widget.discount,
            isNegative: true,
          ),
          const SizedBox(height: 8),
          _SummaryRow(
            label: 'Shipping',
            amount: widget.shipping,
          ),
          // Only show buyer protection if amount > 0
          if (widget.buyerProtection > 0) ...[
            const SizedBox(height: 8),
            _SummaryRow(
              label: 'Buyer Protection',
              amount: widget.buyerProtection,
            ),
          ],
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final double amount;
  final bool isNegative;

  const _SummaryRow({
    required this.label,
    required this.amount,
    this.isNegative = false,
  });

  @override
  Widget build(BuildContext context) {
    final displayAmount = isNegative && amount != 0
        ? '-${CurrencyUtils.format(amount.abs())}'
        : CurrencyUtils.format(amount);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: AppTypography.bodyM.copyWith(
            color: AppColors.textPrimary,
          ),
        ),
        Text(
          displayAmount,
          style: AppTypography.bodyM.copyWith(
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
