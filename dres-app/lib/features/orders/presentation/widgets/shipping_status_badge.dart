import 'package:flutter/material.dart';
import 'package:dres/core/widgets/status_badge.dart';
import 'package:dres/features/orders/data/models/order_model.dart';

/// Item shipping status badge
class ShippingStatusBadge extends StatelessWidget {
  final ShippingStatus status;

  const ShippingStatusBadge({
    super.key,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    return StatusBadge(
      status: status.value,
      type: StatusBadgeType.shipping,
      displayText: status.displayName,
    );
  }
}
