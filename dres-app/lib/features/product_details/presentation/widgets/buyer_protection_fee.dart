import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/features/product_details/logic/product_details_bloc/product_details_bloc.dart';
import 'package:dres/features/product_details/logic/product_details_bloc/product_details_event.dart';
import 'package:dres/features/product_details/logic/product_details_bloc/product_details_state.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/l10n/app_localizations.dart';

class BuyerProtectionFee extends StatelessWidget {
  final double feeRate; // Percentage rate (e.g., 10 for 10%)

  const BuyerProtectionFee({
    super.key,
    required this.feeRate,
  });

  void _showBuyerProtectionInfo(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.zero,
                  ),
                  child: Center(
                    child: PhosphorIcon(
                      PhosphorIconsFill.shieldCheck,
                      size: 24,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    l10n.buyerProtectionTitle,
                    style: AppTypography.titleL.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: PhosphorIcon(
                    PhosphorIconsRegular.x,
                    size: 24,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // What you get section
            Text(
              l10n.buyerProtectionWhatYouGet,
              style: AppTypography.bodyL.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 12),
            _buildBenefitItem(context, PhosphorIconsFill.checkCircle, l10n.buyerProtectionBenefit1),
            const SizedBox(height: 8),
            _buildBenefitItem(context, PhosphorIconsFill.checkCircle, l10n.buyerProtectionBenefit2),
            const SizedBox(height: 8),
            _buildBenefitItem(context, PhosphorIconsFill.checkCircle, l10n.buyerProtectionBenefit3),
            
            const SizedBox(height: 24),
            
            // Without protection section
            Text(
              l10n.buyerProtectionWithout,
              style: AppTypography.bodyL.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 12),
            _buildBenefitItem(context, PhosphorIconsFill.xCircle, l10n.buyerProtectionWithoutItem1, isNegative: true),
            const SizedBox(height: 8),
            _buildBenefitItem(context, PhosphorIconsFill.xCircle, l10n.buyerProtectionWithoutItem2, isNegative: true),
            
            const SizedBox(height: 24),
            
            // Cost info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.05),
                borderRadius: BorderRadius.zero,
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
              ),
              child: Row(
                children: [
                  PhosphorIcon(
                    PhosphorIconsFill.info,
                    size: 20,
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Buyer Protection costs just ${feeRate.toStringAsFixed(0)}% of the item price.',
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Close button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.zero,
                  ),
                ),
                child: Text(
                  'Got it',
                  style: AppTypography.bodyL.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildBenefitItem(BuildContext context, IconData icon, String text, {bool isNegative = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PhosphorIcon(
          icon,
          size: 20,
          color: isNegative ? AppColors.error : AppColors.success,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: AppTypography.bodyM.copyWith(
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return BlocBuilder<ProductDetailsBloc, ProductDetailsState>(
      buildWhen: (previous, current) => previous.buyerProtection != current.buyerProtection,
      builder: (context, state) {
        final isSelected = state.buyerProtection;
        
        return GestureDetector(
          onTap: () {
            context.read<ProductDetailsBloc>().add(
              UpdateBuyerProtection(buyerProtection: !isSelected),
            );
          },
          child: Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border.all(
                color: AppColors.textPrimary,
                width: 1,
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left section with icon and text
                Expanded(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Shield icon
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE5E5EA),
                          borderRadius: BorderRadius.zero,
                        ),
                        child: Center(
                          child: PhosphorIcon(
                            PhosphorIconsFill.shield,
                            size: 14,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      
                      // Text content
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l10n.includeBuyerProtectionFee,
                              style: AppTypography.bodyL.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 5),
                            Text(
                              l10n.buyerProtectionDescription,
                              style: AppTypography.bodyM.copyWith(
                                height: 1.2,
                                fontSize: 16
                              ),
                            ),

                const SizedBox(height: 10),
                GestureDetector(
                  onTap: () => _showBuyerProtectionInfo(context),
                  child: Text(
                    l10n.learnMore,
                    style: AppTypography.bodyM.copyWith(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                )
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                
                // Right section with price and checkbox
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    PhosphorIcon(
                      isSelected
                          ? PhosphorIconsFill.checkCircle
                          : PhosphorIconsRegular.circle,
                      size: 24,
                      color: AppColors.textPrimary,
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
