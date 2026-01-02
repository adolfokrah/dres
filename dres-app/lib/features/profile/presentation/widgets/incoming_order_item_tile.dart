import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/image_viewer.dart';
import 'package:dres/core/widgets/status_badge.dart';
import 'package:dres/features/orders/data/models/incoming_order_details_model.dart';

/// Incoming order item tile widget (seller's view)
class IncomingOrderItemTile extends StatefulWidget {
  final IncomingOrderItemModel item;
  final VoidCallback? onNotAvailableTap;
  final VoidCallback? onAcceptReturnTap;

  const IncomingOrderItemTile({
    super.key,
    required this.item,
    this.onNotAvailableTap,
    this.onAcceptReturnTap,
  });

  @override
  State<IncomingOrderItemTile> createState() => _IncomingOrderItemTileState();
}

class _IncomingOrderItemTileState extends State<IncomingOrderItemTile> {
  bool _isReturnExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.secondary, width: 1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Item info row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product image
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: AppColors.background,
                  image: widget.item.resolvedImageUrl != null
                      ? DecorationImage(
                          image: NetworkImage(widget.item.resolvedImageUrl!),
                          fit: BoxFit.contain,
                        )
                      : null,
                ),
                child: widget.item.resolvedImageUrl == null
                    ? Icon(
                        Icons.image_outlined,
                        size: 24,
                        color: AppColors.textHint,
                      )
                    : null,
              ),
              const SizedBox(width: 16),
              // Product info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Brand name
                    if (widget.item.brandName != null && widget.item.brandName!.isNotEmpty)
                      Text(
                        widget.item.brandName!.toUpperCase(),
                        style: AppTypography.bodyL.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    // Variation title
                    if (widget.item.variationTitle != null && widget.item.variationTitle!.isNotEmpty)
                      Text(
                        widget.item.variationTitle!.toUpperCase(),
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    // SKU option and Quantity (e.g., "Size: L/2 x2")
                    Text(
                      widget.item.skuOptionValue != null && widget.item.skuOptionValue!.isNotEmpty
                          ? '${widget.item.skuOptionValue} x${widget.item.quantity}'
                          : 'x${widget.item.quantity}',
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              // Price at far right
              Text(
                '₵${(widget.item.originalPrice * widget.item.quantity).toStringAsFixed(2)}',
                style: AppTypography.bodyL.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Status badge
          _buildStatusBadge(),

          // "Not available" button - only for placed items
          if (widget.item.canMarkNotAvailable) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: AppButton.outlined(
                text: 'Not available',
                onPressed: widget.onNotAvailableTap,
                height: 44,
              ),
            ),
          ],

          // Return info section - for items with return in progress or returned
          if (widget.item.hasReturnInfo) ...[
            const SizedBox(height: 16),
            _buildReturnSection(context),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusBadge() {
    final status = widget.item.shippingStatus;
    return StatusBadge(
      status: status.value,
      type: StatusBadgeType.shipping,
      displayText: status.displayName,
    );
  }

  Widget _buildReturnSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Return reason header (collapsible)
        GestureDetector(
          onTap: () {
            setState(() {
              _isReturnExpanded = !_isReturnExpanded;
            });
          },
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: const BoxDecoration(
              border: Border(
                bottom: BorderSide(color: AppColors.secondary, width: 1),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Reason of return',
                  style: AppTypography.bodyL.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                AnimatedRotation(
                  turns: _isReturnExpanded ? 0.5 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    PhosphorIcons.caretDown(),
                    size: 16,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ),

        // Collapsible content
        AnimatedCrossFade(
          firstChild: const SizedBox.shrink(),
          secondChild: _buildReturnContent(),
          crossFadeState: _isReturnExpanded
              ? CrossFadeState.showSecond
              : CrossFadeState.showFirst,
          duration: const Duration(milliseconds: 200),
        ),
      ],
    );
  }

  Widget _buildReturnContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 15),

        // Return reason
        if (widget.item.returnReasonLabel != null)
          Row(
            children: [
              Icon(
                PhosphorIcons.checkCircle(PhosphorIconsStyle.fill),
                size: 14,
                color: AppColors.textPrimary,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  widget.item.returnReasonLabel!,
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),

        // Return image (tappable to view full screen)
        if (widget.item.resolvedReturnImageUrl != null) ...[
          const SizedBox(height: 30),
          GestureDetector(
            onTap: () {
              ImageViewer.show(context, widget.item.resolvedReturnImageUrl!);
            },
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: Image.network(
                widget.item.resolvedReturnImageUrl!,
                width: 195,
                height: 260,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    width: 195,
                    height: 260,
                    color: AppColors.surface,
                    child: Icon(
                      Icons.broken_image_outlined,
                      size: 48,
                      color: AppColors.textHint,
                    ),
                  );
                },
              ),
            ),
          ),
        ],

        // Accept return button - only for items with return in progress (not already returned)
        if (widget.item.hasReturnInProgress) ...[
          const SizedBox(height: 30),
          SizedBox(
            width: double.infinity,
            child: AppButton.outlined(
              text: 'Accept return',
              onPressed: widget.onAcceptReturnTap,
              height: 44,
            ),
          ),
        ],
      ],
    );
  }
}
