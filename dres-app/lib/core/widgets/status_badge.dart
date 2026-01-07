import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/theme/status_colors.dart';

/// Status badge type
enum StatusBadgeType {
  /// Order-level status (new, placed, in_progress, completed, cancelled)
  order,
  /// Item/shipping status (placed, out_for_delivery, delivered, return_in_progress, returned, not_available)
  shipping,
  /// Transaction status (pending, in_progress, completed, cancelled)
  transaction,
}

/// A reusable status badge widget matching CMS styling.
/// Shows a colored dot with status text on a semi-transparent background.
class StatusBadge extends StatelessWidget {
  /// The status string (e.g., 'completed', 'in_progress', 'delivered')
  final String status;

  /// The type of status badge (order or shipping)
  final StatusBadgeType type;

  /// Optional custom display text. If null, uses default label.
  final String? displayText;

  const StatusBadge({
    super.key,
    required this.status,
    this.type = StatusBadgeType.order,
    this.displayText,
  });

  @override
  Widget build(BuildContext context) {
    final color = _getColor();
    final label = displayText ?? _getDisplayText();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: StatusColors.getBackgroundColor(color),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: AppTypography.bodyS.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Color _getColor() {
    if (type == StatusBadgeType.shipping) {
      return StatusColors.getShippingStatusColor(status);
    }
    if (type == StatusBadgeType.transaction) {
      return StatusColors.getTransactionStatusColor(status);
    }
    return StatusColors.getOrderStatusColor(status);
  }

  String _getDisplayText() {
    if (type == StatusBadgeType.shipping) {
      return _shippingStatusLabels[status] ?? status;
    }
    if (type == StatusBadgeType.transaction) {
      return _transactionStatusLabels[status] ?? status;
    }
    return _orderStatusLabels[status] ?? status;
  }

  static const Map<String, String> _orderStatusLabels = {
    'new': 'New',
    'placed': 'Placed',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
  };

  static const Map<String, String> _shippingStatusLabels = {
    'placed': 'Placed',
    'out_for_delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'return_in_progress': 'Return in Progress',
    'returned': 'Returned',
    'not_available': 'Not Available',
    'cancelled': 'Cancelled',
    'disputed': 'Disputed',
  };

  static const Map<String, String> _transactionStatusLabels = {
    'pending': 'Pending',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
  };
}
