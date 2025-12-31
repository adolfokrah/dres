import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/media_utils.dart';
import 'package:dres/core/widgets/status_badge.dart';
import 'package:dres/features/profile/data/models/purchase_model.dart';

/// Purchase card widget for purchases list
class PurchaseCard extends StatelessWidget {
  final PurchaseModel purchase;
  final VoidCallback? onTap;

  const PurchaseCard({
    super.key,
    required this.purchase,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // Get one image per item (up to 3)
    final images = _getProductImages();
    final moreCount = purchase.items.length - 3;

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
                    '#${purchase.orderId}',
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

                  // Status badge
                  StatusBadge(
                    status: purchase.status.apiValue,
                    type: StatusBadgeType.order,
                    displayText: purchase.status.displayName,
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
    for (final item in purchase.items) {
      final imageUrl = item.imageUrl;
      if (imageUrl != null && imageUrl.isNotEmpty) {
        // Resolve relative URLs to full URLs
        images.add(MediaUtils.resolveUrl(imageUrl) ?? imageUrl);
      } else {
        images.add(null); // Add null for placeholder
      }
      if (images.length >= 3) break;
    }
    // Ensure at least 1 item if we have items
    if (images.isEmpty && purchase.items.isNotEmpty) {
      images.add(null);
    }
    return images;
  }

  /// Get location text from shipping address (city - region format)
  String _getLocationText() {
    final address = purchase.shippingAddress;
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
    return Container(
      width: 43,
      height: 43,
      decoration: BoxDecoration(
        image: imageUrl != null
            ? DecorationImage(
                image: NetworkImage(imageUrl!),
                fit: BoxFit.contain,
              )
            : null,
      ),
    );
  }
}
