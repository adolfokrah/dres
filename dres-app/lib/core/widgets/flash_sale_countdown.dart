import 'dart:async';
import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_typography.dart';

class FlashSaleCountdown extends StatefulWidget {
  final DateTime endDate;
  final bool compact;
  final int? discountPercentage;

  const FlashSaleCountdown({
    super.key,
    required this.endDate,
    this.compact = false,
    this.discountPercentage,
  });

  /// Returns true if the end date is in the future (flash sale is active)
  static bool isActive(DateTime? endDate) {
    return endDate != null && endDate.isAfter(DateTime.now());
  }

  @override
  State<FlashSaleCountdown> createState() => _FlashSaleCountdownState();
}

class _FlashSaleCountdownState extends State<FlashSaleCountdown> {
  Timer? _timer;
  Duration _remaining = Duration.zero;

  @override
  void initState() {
    super.initState();
    _updateRemaining();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      _updateRemaining();
    });
  }

  @override
  void didUpdateWidget(FlashSaleCountdown oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.endDate != widget.endDate) {
      _updateRemaining();
    }
  }

  void _updateRemaining() {
    final now = DateTime.now();
    final remaining = widget.endDate.difference(now);
    if (remaining.isNegative) {
      _timer?.cancel();
      _timer = null;
      setState(() => _remaining = Duration.zero);
    } else {
      setState(() => _remaining = remaining);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatCountdown() {
    final days = _remaining.inDays;
    final hours = _remaining.inHours % 24;
    final minutes = _remaining.inMinutes % 60;
    final seconds = _remaining.inSeconds % 60;

    if (widget.compact) {
      if (days > 0) return '${days}d ${hours}h ${minutes}m ${seconds}s';
      if (hours > 0) return '${hours}h ${minutes}m ${seconds}s';
      return '${minutes}m ${seconds}s';
    }

    final parts = <String>[];
    if (days > 0) parts.add('${days}d');
    if (hours > 0 || days > 0) parts.add('${hours}h');
    parts.add('${minutes}m');
    parts.add('${seconds}s');
    return parts.join(' ');
  }

  @override
  Widget build(BuildContext context) {
    if (_remaining == Duration.zero) return const SizedBox.shrink();

    final isCompact = widget.compact;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (!isCompact) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: const BoxDecoration(
              color: Colors.red,
            ),
            child: Text(
              'Flash Sale',
              style: AppTypography.bodyM.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 6),
        ],
        Container(
          padding: EdgeInsets.symmetric(
            horizontal: isCompact ? 6 : 10,
            vertical: isCompact ? 4 : 6,
          ),
          decoration: const BoxDecoration(
            color: Colors.red,
          ),
          child: Text(
            _formatCountdown(),
            style: (isCompact ? AppTypography.bodyS : AppTypography.bodyM).copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        if (widget.discountPercentage != null && widget.discountPercentage! > 0) ...[
          SizedBox(width: isCompact ? 4 : 8),
          Text(
            '-${widget.discountPercentage}%',
            style: (isCompact ? AppTypography.bodyS : AppTypography.bodyM).copyWith(
              color: Colors.red,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ],
    );
  }
}
