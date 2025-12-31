import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/widgets/status_badge.dart';
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
          StatusBadge(
            status: status.value,
            type: StatusBadgeType.order,
            displayText: status.displayName,
          ),
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
