import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/features/orders/data/models/order_model.dart';

/// Progress bar showing order status
class OrderProgressBar extends StatelessWidget {
  final OrderStatus status;
  final int progressValue;

  const OrderProgressBar({
    super.key,
    required this.status,
    required this.progressValue,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Row(
        children: [
          // Progress bars
          Expanded(
            child: Row(
              children: [
                _ProgressSegment(isActive: progressValue >= 1),
                const SizedBox(width: 10),
                _ProgressSegment(isActive: progressValue >= 2),
                const SizedBox(width: 10),
                _ProgressSegment(isActive: progressValue >= 3),
                const SizedBox(width: 10),
                _ProgressSegment(isActive: progressValue >= 4),
              ],
            ),
          ),
          const SizedBox(width: 10),
          // Status badge
          _StatusBadge(status: status),
        ],
      ),
    );
  }
}

class _ProgressSegment extends StatelessWidget {
  final bool isActive;

  const _ProgressSegment({required this.isActive});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        height: 8,
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFFACF8BF) : AppColors.gray,
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final OrderStatus status;

  const _StatusBadge({required this.status});

  Color get _backgroundColor {
    switch (status) {
      case OrderStatus.completed:
        return const Color(0xFFACF8BF);
      case OrderStatus.cancelled:
        return AppColors.gray;
      case OrderStatus.inProgress:
        return AppColors.info;
      case OrderStatus.placed:
        return AppColors.info;
      case OrderStatus.newOrder:
        return AppColors.warning;
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
