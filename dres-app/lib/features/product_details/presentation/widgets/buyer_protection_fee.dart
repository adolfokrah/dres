import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/l10n/app_localizations.dart';

class BuyerProtectionFee extends StatefulWidget {
  final double fee;

  const BuyerProtectionFee({
    super.key,
    required this.fee,
  });

  @override
  State<BuyerProtectionFee> createState() => _BuyerProtectionFeeState();
}

class _BuyerProtectionFeeState extends State<BuyerProtectionFee> {
  bool isSelected = true;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          isSelected = !isSelected;
        });
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
                      borderRadius: BorderRadius.circular(100),
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
            Text(
              l10n.learnMore,
              style: AppTypography.bodyM.copyWith(
                fontWeight: FontWeight.w700,
                fontSize: 16,
                decoration: TextDecoration.underline,
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
  }
}
