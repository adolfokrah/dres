import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/quantity_selector.dart';
import 'package:dres/core/services/storage_service.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/cart/data/repositories/cart_repository.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_bloc.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_state.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_event.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/l10n/app_localizations.dart';

class AddToBagButton extends StatefulWidget {
  final String? variationId;
  final String? selectedSkuId;
  final bool isOutOfStock;
  final bool buyerProtection;
  final int? maxStock;

  const AddToBagButton({
    super.key,
    this.variationId,
    this.selectedSkuId,
    this.isOutOfStock = false,
    this.buyerProtection = false,
    this.maxStock,
  });

  @override
  State<AddToBagButton> createState() => _AddToBagButtonState();
}

class _AddToBagButtonState extends State<AddToBagButton> {
  bool _isLoading = false;

  /// Find quantity of this item in cart
  int _getCartQuantity(CartState cartState) {
    if (widget.variationId == null || widget.selectedSkuId == null) return 0;
    
    for (final item in cartState.items) {
      if (item.variationId == widget.variationId && 
          item.skuId == widget.selectedSkuId) {
        return item.quantity;
      }
    }
    return 0;
  }

  Future<void> _handleAddToBag(BuildContext context, {int quantity = 1}) async {
    final storageService = getIt<StorageService>();
    final token = await storageService.getToken();

    if (token == null || token.isEmpty) {
      // User not logged in - set redirect to current product and navigate to auth
      if (context.mounted) {
        final productPath = '/products/${widget.variationId}${widget.selectedSkuId != null ? '?skuId=${widget.selectedSkuId}' : ''}';
        context.read<AuthBloc>().add(AuthSetRedirect(productPath));
        context.push('/auth');
      }
      return;
    }

    // Validate required fields
    if (widget.variationId == null || widget.selectedSkuId == null) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please select a size/option'),
            backgroundColor: AppColors.error,
          ),
        );
      }
      return;
    }

    setState(() => _isLoading = true);

    try {
      final cartRepository = getIt<CartRepository>();
      final response = await cartRepository.addToCart(
        variationId: widget.variationId!,
        skuId: widget.selectedSkuId!,
        quantity: quantity,
        buyerProtection: widget.buyerProtection,
      );

      if (context.mounted) {
        // Refresh cart state
        context.read<CartBloc>().add(const CartFetchRequested());
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response.action == 'updated' 
                ? 'Cart updated!' 
                : 'Added to bag!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        String errorMessage = 'Failed to add to bag';
        if (e.toString().contains('out of stock')) {
          errorMessage = 'This product is out of stock';
        } else if (e.toString().contains('Only')) {
          errorMessage = e.toString().replaceAll('Exception: ', '');
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleUpdateQuantity(BuildContext context, int newQuantity) async {
    if (newQuantity < 1) {
      // TODO: Remove item from cart
      return;
    }

    // Check max stock
    if (widget.maxStock != null && newQuantity > widget.maxStock!) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Only ${widget.maxStock} available in stock'),
            backgroundColor: AppColors.error,
          ),
        );
      }
      return;
    }

    setState(() => _isLoading = true);

    try {
      final cartRepository = getIt<CartRepository>();
      await cartRepository.updateCartItemQuantity(
        variationId: widget.variationId!,
        skuId: widget.selectedSkuId!,
        quantity: newQuantity,
      );

      if (context.mounted) {
        // Refresh cart state
        context.read<CartBloc>().add(const CartFetchRequested());
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update quantity'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return BlocBuilder<CartBloc, CartState>(
      builder: (context, cartState) {
        final cartQuantity = _getCartQuantity(cartState);
        final isInCart = cartQuantity > 0;

        // If out of stock, show disabled button
        if (widget.isOutOfStock) {
          return AppButton.filled(
            text: l10n.outOfStock,
            onPressed: null,
            width: double.infinity,
          );
        }

        // If in cart, show quantity selector
        if (isInCart) {
          return QuantitySelector(
            quantity: cartQuantity,
            isLoading: _isLoading,
            maxStock: widget.maxStock,
            onDecrement: () => _handleUpdateQuantity(context, cartQuantity - 1),
            onIncrement: () => _handleUpdateQuantity(context, cartQuantity + 1),
          );
        }

        // Default: Add to bag button
        return AppButton.filled(
          text: l10n.addToBag,
          onPressed: _isLoading ? null : () => _handleAddToBag(context),
          isLoading: _isLoading,
          width: double.infinity,
        );
      },
    );
  }
}
