import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/features/orders/data/models/order_model.dart';

/// Item shipping status badge
class ShippingStatusBadge extends StatelessWidget {
  final ShippingStatus status;

  const ShippingStatusBadge({
    super.key,
    required this.status,
  });

  Color get _backgroundColor {
    switch (status) {
      case ShippingStatus.delivered:
        return const Color(0xFFACF8BF);
      case ShippingStatus.outForDelivery:
        return AppColors.info;
      case ShippingStatus.placed:
        return AppColors.info;
      case ShippingStatus.returnInProgress:
        return AppColors.warning;
      case ShippingStatus.returned:
        return AppColors.gray;
      case ShippingStatus.notAvailable:
        return AppColors.gray;
      case ShippingStatus.cancelled:
        return AppColors.gray;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 5),
      decoration: BoxDecoration(
        color: _backgroundColor,
        borderRadius: BorderRadius.circular(2),
      ),
      child: Text(
        status.displayName,
        style: AppTypography.bodyS.copyWith(
          color: AppColors.textPrimary,
        ),
      ),
    );
  }
}
