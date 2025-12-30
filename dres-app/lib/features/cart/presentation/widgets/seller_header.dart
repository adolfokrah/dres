import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/media_utils.dart';

class SellerHeader extends StatelessWidget {
  final String sellerName;
  final String? sellerPhotoUrl;
  final bool isTrustedSeller;

  const SellerHeader({
    super.key,
    required this.sellerName,
    this.sellerPhotoUrl,
    this.isTrustedSeller = false,
  });

  @override
  Widget build(BuildContext context) {
    final resolvedPhotoUrl = MediaUtils.resolveUrl(sellerPhotoUrl);
    
    return Row(
      children: [
        // Seller avatar
        Container(
          width: 57,
          height: 57,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.secondary,
            image: resolvedPhotoUrl != null
                ? DecorationImage(
                    image: NetworkImage(resolvedPhotoUrl),
                    fit: BoxFit.cover,
                  )
                : null,
          ),
          child: resolvedPhotoUrl == null
              ? Center(
                  child: Text(
                    sellerName.isNotEmpty ? sellerName[0].toUpperCase() : 'S',
                    style: AppTypography.titleL.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                )
              : null,
        ),
        const SizedBox(width: 7),
        // Seller info
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              sellerName,
              style: AppTypography.bodyL.copyWith(color: AppColors.textPrimary),
            ),
            if (isTrustedSeller)
              Row(
                children: [
                  Icon(
                    PhosphorIcons.sealCheck(PhosphorIconsStyle.fill),
                    size: 14,
                    color: AppColors.textPrimary,
                  ),
                  const SizedBox(width: 5),
                  Text(
                    'Trusted Seller',
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
          ],
        ),
      ],
    );
  }
}
