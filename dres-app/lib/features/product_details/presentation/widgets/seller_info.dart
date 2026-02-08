import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/l10n/app_localizations.dart';
import 'package:dres/core/widgets/follow_button.dart';
import 'package:dres/core/widgets/profile_avatar.dart';
import 'package:dres/features/product_details/data/repositories/seller_repository.dart';
import 'package:dres/features/product_details/data/models/seller_model.dart';
import 'package:dres/core/di/injection.dart';

class SellerInfo extends StatefulWidget {
  final String sellerId;

  const SellerInfo({
    super.key,
    required this.sellerId,
  });

  @override
  State<SellerInfo> createState() => _SellerInfoState();
}

class _SellerInfoState extends State<SellerInfo> {
  late final SellerRepository _sellerRepository;
  late Future<SellerModel> _sellerFuture;

  @override
  void initState() {
    super.initState();
    _sellerRepository = getIt<SellerRepository>();
    _sellerFuture = _sellerRepository.getSellerInfo(sellerId: widget.sellerId);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return FutureBuilder<SellerModel>(
      future: _sellerFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: CircularProgressIndicator(),
            ),
          );
        }

        if (snapshot.hasError) {
          return Padding(
            padding: const EdgeInsets.all(20),
            child: Text(
              'Error loading seller info: ${snapshot.error}',
              style: AppTypography.bodyS.copyWith(
                color: AppColors.error,
              ),
            ),
          );
        }

        if (!snapshot.hasData) {
          return const SizedBox.shrink();
        }

        final seller = snapshot.data!;

        return _buildSellerInfo(seller, l10n);
      },
    );
  }

  Widget _buildSellerInfo(SellerModel seller, AppLocalizations l10n) {
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
                // Left section with avatar and info - tappable to go to seller profile
                Expanded(
                  child: GestureDetector(
                    onTap: () => context.push('/sellers/${seller.id}'),
                    child: Row(
                      children: [
                        // Profile image with initials fallback
                        ProfileAvatar(
                          photoUrl: seller.profileImage,
                          displayName: seller.name,
                          size: 50,
                        ),
                        const SizedBox(width: 17),
                        
                        // Name and username
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      seller.name,
                                      style: AppTypography.bodyL,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  if (seller.trustedSeller) ...[
                                    const SizedBox(width: 4),
                                    Icon(
                                      PhosphorIcons.sealCheck(PhosphorIconsStyle.fill),
                                      size: 16,
                                      color: const Color(0xFF1DA1F2),
                                    ),
                                  ],
                                ],
                              ),
                              if (seller.username != null && seller.username!.isNotEmpty)
                                Text(
                                  '@${seller.username}',
                                  style: AppTypography.bodyM.copyWith(
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                // Follow button
                FollowButton(
                  userId: seller.id,
                  outlined: true,
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
                l10n.usuallyShipsIn(seller.usuallyShipsIn),
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
                        '${seller.salesHistory.itemsSold}\n${l10n.itemsSold}',
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
                        '${seller.salesHistory.shipped}\n${l10n.shipped}',
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
                        '${seller.salesHistory.cancelled}\n${l10n.cancelled}',
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

