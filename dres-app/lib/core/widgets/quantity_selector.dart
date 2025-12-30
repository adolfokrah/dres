import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

/// A quantity selector widget with decrement, quantity display, and increment buttons
/// Used in product details and cart screens
/// Supports optimistic updates - updates UI immediately while syncing with server
class QuantitySelector extends StatefulWidget {
  final int quantity;
  final bool isLoading;
  final int? maxStock;
  final VoidCallback? onDecrement;
  final VoidCallback? onIncrement;
  final double height;

  const QuantitySelector({
    super.key,
    required this.quantity,
    this.isLoading = false,
    this.maxStock,
    this.onDecrement,
    this.onIncrement,
    this.height = 45,
  });

  @override
  State<QuantitySelector> createState() => _QuantitySelectorState();
}

class _QuantitySelectorState extends State<QuantitySelector> {
  late int _displayQuantity;

  @override
  void initState() {
    super.initState();
    _displayQuantity = widget.quantity;
  }

  @override
  void didUpdateWidget(QuantitySelector oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Sync with external quantity when it changes (e.g., from server response)
    if (widget.quantity != oldWidget.quantity) {
      _displayQuantity = widget.quantity;
    }
  }

  void _handleDecrement() {
    if (_displayQuantity > 1) {
      // Optimistic update
      setState(() {
        _displayQuantity--;
      });
      // Trigger actual update
      widget.onDecrement?.call();
    }
  }

  void _handleIncrement() {
    final canIncrement = widget.maxStock == null || _displayQuantity < widget.maxStock!;
    if (canIncrement) {
      // Optimistic update
      setState(() {
        _displayQuantity++;
      });
      // Trigger actual update
      widget.onIncrement?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    final canDecrement = _displayQuantity > 1;
    final canIncrement = widget.maxStock == null || _displayQuantity < widget.maxStock!;

    return Container(
      height: widget.height,
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.textPrimary, width: 1),
      ),
      child: Row(
        children: [
          // Decrement button
          Expanded(
            child: InkWell(
              onTap: widget.isLoading || !canDecrement ? null : _handleDecrement,
              child: Container(
                height: double.infinity,
                alignment: Alignment.center,
                child: widget.isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(
                        '−',
                        style: AppTypography.titleL.copyWith(
                          color: canDecrement
                              ? AppColors.textPrimary
                              : AppColors.textSecondary,
                        ),
                      ),
              ),
            ),
          ),
          
          // Left divider
          Container(
            width: 1,
            height: double.infinity,
            color: AppColors.textPrimary,
          ),
          
          // Quantity display
          Expanded(
            child: Container(
              alignment: Alignment.center,
              child: Text(
                '$_displayQuantity',
                style: AppTypography.bodyL.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ),
          
          // Right divider
          Container(
            width: 1,
            height: double.infinity,
            color: AppColors.textPrimary,
          ),
          
          // Increment button
          Expanded(
            child: InkWell(
              onTap: widget.isLoading || !canIncrement ? null : _handleIncrement,
              child: Container(
                height: double.infinity,
                alignment: Alignment.center,
                child: Text(
                  '+',
                  style: AppTypography.titleL.copyWith(
                    color: canIncrement 
                        ? AppColors.textPrimary 
                        : AppColors.textSecondary,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
