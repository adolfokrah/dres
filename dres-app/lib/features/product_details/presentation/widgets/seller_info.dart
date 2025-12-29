import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/l10n/app_localizations.dart';
import 'package:dres/core/utilities/media_utils.dart';
import 'package:dres/core/widgets/app_button.dart';

class SellerInfo extends StatelessWidget {
  final String id;
  final String name;
  final String username;
  final String? profileImage;
  final bool verified;
  final bool vacationMode;
  final String usuallyShipsIn;
  final int itemsSold;
  final int shipped;
  final int cancelled;
  final String memberSince;

  const SellerInfo({
    super.key,
    required this.id,
    required this.name,
    required this.username,
    this.profileImage,
    required this.verified,
    required this.vacationMode,
    required this.usuallyShipsIn,
    required this.itemsSold,
    required this.shipped,
    required this.cancelled,
    required this.memberSince,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Container(
      decoration: BoxDecoration(
        border: Border.all(
          color: const Color(0xFFAEAEB2),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          // Top section with profile and follow button
          Padding(
            padding: const EdgeInsets.all(10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Left section with avatar and info
                Row(
                  children: [
                    // Profile image
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFFD9D9D9),
                        image: profileImage != null
                            ? DecorationImage(
                                image: NetworkImage(
                                  MediaUtils.resolveUrl(profileImage) ?? '',
                                ),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(width: 17),
                    
                    // Name and username
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: AppTypography.bodyL,
                        ),
                        Text(
                          username,
                          style: AppTypography.bodyM.copyWith(
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                
                // Follow button
                AppButton.outlined(
                  text: l10n.follow,
                  height: 32,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  onPressed: () {
                    // TODO: Implement follow functionality
                  },
                ),
              ],
            ),
          ),
          
          // Usually ships in text
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                l10n.usuallyShipsIn(usuallyShipsIn),
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 10),
          
          // Sales history section
          Container(
            decoration: const BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: Color(0xFFAEAEB2),
                  width: 1,
                ),
              ),
            ),
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.salesHistory,
                  style: AppTypography.bodyM.copyWith(
                    color: const Color(0xFF4E4E4E),
                  ),
                ),
                const SizedBox(height: 14),
                
                // Stats row
                Row(
                  children: [
                    // Items sold
                    Container(
                      padding: const EdgeInsets.only(right: 10),
                      decoration: const BoxDecoration(
                        border: Border(
                          right: BorderSide(
                            color: Color(0xFF9B9B9B),
                            width: 1,
                          ),
                        ),
                      ),
                      child: Text(
                        '$itemsSold\n${l10n.itemsSold}',
                        textAlign: TextAlign.center,
                        style: AppTypography.bodyM.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    
                    // Shipped
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: const BoxDecoration(
                        border: Border(
                          right: BorderSide(
                            color: Color(0xFF9B9B9B),
                            width: 1,
                          ),
                        ),
                      ),
                      child: Text(
                        '$shipped\n${l10n.shipped}',
                        textAlign: TextAlign.center,
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    
                    // Cancelled
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Text(
                        '$cancelled\n${l10n.cancelled}',
                        textAlign: TextAlign.center,
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
