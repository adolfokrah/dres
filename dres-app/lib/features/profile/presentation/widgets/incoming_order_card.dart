import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/media_utils.dart';
import 'package:dres/core/widgets/status_badge.dart';
import 'package:dres/features/orders/data/models/incoming_order_model.dart';

/// Incoming order card widget for seller's incoming orders list
class IncomingOrderCard extends StatelessWidget {
  final IncomingOrderModel order;
  final VoidCallback? onTap;

  const IncomingOrderCard({
    super.key,
    required this.order,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // Get one image per item (up to 3)
    final images = _getProductImages();
    final moreCount = order.items.length - 3;

    // Get location from shipping address (city - region)
    final location = _getLocationText();

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            // Left content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product images row - one per item
                  Row(
                    children: [
                      ...images.take(3).map((imageUrl) => Padding(
                            padding: const EdgeInsets.only(right: 3),
                            child: _ProductImage(imageUrl: imageUrl),
                          )),
                      if (moreCount > 0)
                        Padding(
                          padding: const EdgeInsets.only(left: 5),
                          child: Text(
                            '$moreCount+ more',
                            style: AppTypography.bodyS.copyWith(
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Order ID and location
                  Text(
                    '#${order.orderId}',
                    style: AppTypography.bodyM.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  if (location.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      location,
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                  const SizedBox(height: 6),

                  // Status badge (use sellerStatus for seller-specific status)
                  StatusBadge(
                    status: order.sellerStatus.apiValue,
                    type: StatusBadgeType.order,
                    displayText: order.sellerStatus.displayName,
                  ),
                ],
              ),
            ),

            // Chevron right
            Icon(
              PhosphorIcons.caretRight(),
              size: 14,
              color: AppColors.textPrimary,
            ),
          ],
        ),
      ),
    );
  }

  /// Get one image per item (variation image) - if no images, return nulls for placeholder
  List<String?> _getProductImages() {
    final images = <String?>[];
    for (final item in order.items) {
      final imageUrl = item.imageUrl;
      if (imageUrl != null && imageUrl.isNotEmpty) {
        // Resolve relative URLs to full URLs
        final resolvedUrl = MediaUtils.resolveUrl(imageUrl);
        images.add(resolvedUrl);
      } else {
        images.add(null); // Add null for placeholder
      }
      if (images.length >= 3) break;
    }
    // Ensure at least 1 item if we have items
    if (images.isEmpty && order.items.isNotEmpty) {
      images.add(null);
    }
    return images;
  }

  /// Get location text from shipping address (city - region format)
  String _getLocationText() {
    final address = order.shippingAddress;
    if (address == null) return '';
    
    // Use cityRegion getter for "City - Region" format
    return address.cityRegion;
  }
}

class _ProductImage extends StatelessWidget {
  final String? imageUrl;

  const _ProductImage({this.imageUrl});

  @override
  Widget build(BuildContext context) {
    if (imageUrl == null || imageUrl!.isEmpty) {
      return Container(
        width: 43,
        height: 43,
        color: AppColors.surface,
        child: PhosphorIcon(
          PhosphorIconsRegular.image,
          size: 20,
          color: AppColors.textHint,
        ),
      );
    }

    return Image.network(
      imageUrl!,
      width: 43,
      height: 43,
      fit: BoxFit.contain,
      errorBuilder: (context, error, stackTrace) {
        return Container(
          width: 43,
          height: 43,
          color: AppColors.surface,
          child: PhosphorIcon(
            PhosphorIconsRegular.imageBroken,
            size: 20,
            color: AppColors.textHint,
          ),
        );
      },
    );
  }
}
