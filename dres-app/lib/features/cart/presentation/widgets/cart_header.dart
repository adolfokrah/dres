import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:go_router/go_router.dart';

class CartHeader extends StatelessWidget {
  final int itemCount;
  final bool isEditMode;
  final VoidCallback? onEditTap;

  const CartHeader({
    super.key,
    required this.itemCount,
    this.isEditMode = false,
    this.onEditTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: const BoxDecoration(
        color: AppColors.background,
        border: Border(
          bottom: BorderSide(color: AppColors.secondary, width: 1),
        ),
      ),
      child: Row(
        children: [
          // Back button
          GestureDetector(
            onTap: () {
              if (context.canPop()) {
                context.pop();
              } else {
                context.go('/home');
              }
            },
            child: Icon(
              PhosphorIcons.caretLeft(),
              size: 20,
              color: AppColors.textPrimary,
            ),
          ),

          const Spacer(),

          // Title with item count
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Bags',
                style: AppTypography.bodyL.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                '$itemCount ${itemCount == 1 ? 'item' : 'items'}',
                style: AppTypography.bodyS.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),

          const Spacer(),

          // Edit button - only show when there are items
          if (itemCount > 0 && onEditTap != null)
            GestureDetector(
              onTap: onEditTap,
              child: Text(
                isEditMode ? 'DONE' : 'EDIT',
                style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
              ),
            )
          else
            const SizedBox(width: 40), // Maintain spacing
        ],
      ),
    );
  }
}
