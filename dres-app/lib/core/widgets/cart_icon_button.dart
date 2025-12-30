import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/services/storage_service.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_bloc.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_state.dart';
import 'package:go_router/go_router.dart';

/// A reusable cart/bag icon button widget for headers
/// Displays a bag icon and shows item count badge from CartBloc
/// Checks authentication before navigating to cart
class CartIconButton extends StatelessWidget {
  /// Optional callback when tapped. If null, navigates to cart route.
  final VoidCallback? onTap;
  
  /// Icon size (default: 24)
  final double size;
  
  /// Icon color (default: AppColors.textPrimary)
  final Color? color;
  
  /// Route to redirect to after authentication (default: /cart)
  final String redirectTo;

  const CartIconButton({
    super.key,
    this.onTap,
    this.size = 24,
    this.color,
    this.redirectTo = '/cart',
  });

  Future<void> _handleTap(BuildContext context) async {
    // Check if user is logged in before navigating to cart
    final storageService = getIt<StorageService>();
    final isLoggedIn = await storageService.isLoggedIn();
    
    if (!context.mounted) return;
    
    if (!isLoggedIn) {
      // Not logged in - set redirect in bloc and go to auth
      debugPrint('🔴 CartIconButton: Not logged in, setting redirectTo=$redirectTo');
      context.read<AuthBloc>().add(AuthSetRedirect(redirectTo));
      context.push('/auth');
      return;
    }
    
    // User is logged in
    if (onTap != null) {
      // Use custom callback if provided
      onTap!();
    } else {
      // Default: navigate to the redirectTo route
      context.push(redirectTo);
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CartBloc, CartState>(
      builder: (context, cartState) {
        final itemCount = cartState.itemCount;
        
        return GestureDetector(
          onTap: () => _handleTap(context),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(
                PhosphorIcons.bagSimple(),
                size: size,
                color: color ?? AppColors.textPrimary,
              ),
              if (itemCount > 0)
                Positioned(
                  right: -6,
                  top: -4,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      itemCount > 99 ? '99+' : itemCount.toString(),
                      style: const TextStyle(
                        color: AppColors.textOnPrimary,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
