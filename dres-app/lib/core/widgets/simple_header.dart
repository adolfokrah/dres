import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/cart_icon_button.dart';

class SimpleHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onCartTap;

  const SimpleHeader({
    super.key,
    required this.title,
    this.onCartTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border(
          bottom: BorderSide(
            color: AppColors.border.withValues(alpha: 0.2),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          // Back button
          GestureDetector(
            onTap: () {
              // Check if we can pop, otherwise go to home
              if (context.canPop()) {
                context.pop();
              } else {
                context.go('/home');
              }
            },
            child: Icon(
              PhosphorIcons.caretLeft(),
              size: 24,
              color: AppColors.textPrimary,
            ),
          ),
          
          const SizedBox(width: 16),
          
          // Title
          Expanded(
            child: Text(
              title,
              style: AppTypography.bodyL.copyWith(
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          
          const SizedBox(width: 16),
          
          // Cart/Bag icon
          CartIconButton(onTap: onCartTap),
        ],
      ),
    );
  }
}
