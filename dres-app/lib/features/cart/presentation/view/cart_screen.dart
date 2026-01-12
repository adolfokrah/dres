import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/cart/data/repositories/cart_repository.dart';
import 'package:dres/features/cart/data/repositories/address_repository.dart';
import 'package:dres/features/cart/data/models/seller_group.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_bloc.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_state.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_event.dart';
import 'package:dres/features/cart/presentation/widgets/cart_header.dart';
import 'package:dres/features/cart/presentation/widgets/seller_header.dart';
import 'package:dres/features/cart/presentation/widgets/cart_item_tile.dart';
import 'package:dres/features/cart/presentation/widgets/seller_unavailable_message.dart';
import 'package:dres/features/cart/presentation/widgets/cart_summary.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  bool _isEditMode = false;
  final Map<String, bool> _loadingItems = {};
  // Optimistic quantity updates - key: variationId_skuId, value: quantity
  final Map<String, int> _optimisticQuantities = {};
  bool _hasCalculatedShipping = false;
  // Debounce timers for quantity updates - prevents rapid concurrent API calls
  final Map<String, Timer> _debounceTimers = {};
  // Track pending quantity updates
  final Map<String, int> _pendingQuantities = {};

  @override
  void initState() {
    super.initState();
    // Refresh cart when screen opens
    context.read<CartBloc>().add(const CartFetchRequested());
    // Calculate shipping based on default address
    _calculateShippingFromDefaultAddress();
  }

  @override
  void dispose() {
    // Cancel all pending timers
    for (final timer in _debounceTimers.values) {
      timer.cancel();
    }
    super.dispose();
  }

  /// Calculate shipping fees based on user's default address
  Future<void> _calculateShippingFromDefaultAddress() async {
    try {
      final addressRepo = getIt<AddressRepository>();
      final addresses = await addressRepo.getAddresses();
      
      // Find default address or use first one
      final defaultAddress = addresses.firstWhere(
        (addr) => addr.isDefault,
        orElse: () => addresses.isNotEmpty ? addresses.first : throw Exception('No addresses'),
      );
      
      // If address has a city, update shipping
      if (defaultAddress.cityId != null && mounted && !_hasCalculatedShipping) {
        _hasCalculatedShipping = true;
        context.read<CartBloc>().add(CartUpdateShippingRequested(cityId: defaultAddress.cityId!));
      }
    } catch (_) {
      // No addresses or error - shipping will be calculated when user selects address at checkout
    }
  }

  void _toggleEditMode() {
    setState(() {
      _isEditMode = !_isEditMode;
    });
  }

  /// Get the display quantity for an item (optimistic or actual)
  int _getDisplayQuantity(CartItemModel item) {
    final itemKey = '${item.variationId}_${item.skuId}';
    return _optimisticQuantities[itemKey] ?? item.quantity;
  }

  Future<void> _updateItemQuantity(CartItemModel item, int newQuantity) async {
    if (item.variationId == null || item.skuId == null) return;

    final itemKey = '${item.variationId}_${item.skuId}';
    
    // Optimistic update - update UI immediately
    setState(() {
      if (newQuantity < 1) {
        _optimisticQuantities.remove(itemKey);
      } else {
        _optimisticQuantities[itemKey] = newQuantity;
      }
      _loadingItems[itemKey] = true;
    });

    // Store the pending quantity
    _pendingQuantities[itemKey] = newQuantity;

    // Cancel any existing debounce timer for this item
    _debounceTimers[itemKey]?.cancel();

    // Create new debounce timer - wait 300ms before sending API request
    // This prevents rapid consecutive requests when user taps +/- quickly
    _debounceTimers[itemKey] = Timer(const Duration(milliseconds: 300), () async {
      // Get the final quantity after debounce
      final finalQuantity = _pendingQuantities[itemKey] ?? newQuantity;
      final previousQuantity = item.quantity;
      
      try {
        final cartRepository = getIt<CartRepository>();

        if (finalQuantity < 1) {
          // Remove item
          await cartRepository.removeCartItem(
            variationId: item.variationId!,
            skuId: item.skuId!,
          );
        } else {
          // Update quantity
          await cartRepository.updateCartItemQuantity(
            variationId: item.variationId!,
            skuId: item.skuId!,
            quantity: finalQuantity,
          );
        }

        if (mounted) {
          // Fetch updated cart - will clear optimistic state on success
          context.read<CartBloc>().add(const CartFetchRequested());
          // Clear optimistic quantity after successful update
          setState(() {
            _optimisticQuantities.remove(itemKey);
            _loadingItems[itemKey] = false;
          });
        }
      } catch (e) {
        if (mounted) {
          // Revert optimistic update on error
          setState(() {
            if (previousQuantity > 0) {
              _optimisticQuantities[itemKey] = previousQuantity;
            } else {
              _optimisticQuantities.remove(itemKey);
            }
            _loadingItems[itemKey] = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to update cart: ${e.toString()}'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      } finally {
        // Clean up pending quantity
        _pendingQuantities.remove(itemKey);
        _debounceTimers.remove(itemKey);
      }
    });
  }

  Future<void> _removeItem(CartItemModel item) async {
    if (item.variationId == null || item.skuId == null) return;

    final itemKey = '${item.variationId}_${item.skuId}';
    setState(() => _loadingItems[itemKey] = true);

    try {
      final cartRepository = getIt<CartRepository>();
      await cartRepository.removeCartItem(
        variationId: item.variationId!,
        skuId: item.skuId!,
      );

      if (mounted) {
        // Refresh cart - BlocListener will handle state changes
        context.read<CartBloc>().add(const CartFetchRequested());
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to remove item'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loadingItems.remove(itemKey));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: BlocListener<CartBloc, CartState>(
          listener: (context, state) {
            // Reset edit mode when cart becomes empty
            if ((state.cart == null || state.items.isEmpty) && _isEditMode) {
              setState(() => _isEditMode = false);
            }
          },
          child: BlocBuilder<CartBloc, CartState>(
            builder: (context, state) {
            if (state.status == CartStatus.loading && state.cart == null) {
              return const Center(child: CircularProgressIndicator());
            }

            if (state.cart == null || state.items.isEmpty) {
              return _EmptyCart();
            }

            final sellerGroups = SellerGroup.groupBySeller(state.items);

            // Calculate totals
            final itemsTotal = sellerGroups.fold(
              0.0,
              (sum, group) => sum + group.totalPrice,
            );
            
            // Use validation from backend
            final canProceedToCheckout = state.isValid;
            
            // Check if any items are currently loading (deleting/updating)
            final hasLoadingItems = _loadingItems.values.any((v) => v);

            return Column(
              children: [
                // Loading bar at top when items are being deleted/updated
                if (hasLoadingItems)
                  const LinearProgressIndicator(
                    backgroundColor: AppColors.secondary,
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                  ),
                
                // Header
                CartHeader(
                  itemCount: state.itemCount,
                  isEditMode: _isEditMode,
                  onEditTap: _toggleEditMode,
                ),

                // Scrollable content: seller sections
                Expanded(
                  child: ListView(
                    children: [
                      // Cart items grouped by seller
                      ...sellerGroups.map((group) => _SellerSection(
                        group: group,
                        isEditMode: _isEditMode,
                        loadingItems: _loadingItems,
                        onUpdateQuantity: _updateItemQuantity,
                        onRemoveItem: _removeItem,
                      )),
                    ],
                  ),
                ),

                // Fixed bottom: Item count + Subtotal + Next button
                CartSummary(
                  itemCount: state.itemCount,
                  subtotal: itemsTotal,
                  canProceed: canProceedToCheckout,
                  onNextPressed: () {
                    context.push('/checkout');
                  },
                ),
              ],
            );
            },
          ),
        ),
      ),
    );
  }
}

class _EmptyCart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        CartHeader(itemCount: 0, onEditTap: null),
        Expanded(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withOpacity(0.3),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    PhosphorIcons.shoppingBag(
                      PhosphorIconsStyle.thin,
                    ),
                    size: 124,
                    color: AppColors.textSecondary.withValues(alpha: 0.5),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Your bag is empty',
                  style: AppTypography.titleL.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Add items to get started',
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _SellerSection extends StatelessWidget {
  final SellerGroup group;
  final bool isEditMode;
  final Map<String, bool> loadingItems;
  final Function(CartItemModel, int) onUpdateQuantity;
  final Function(CartItemModel) onRemoveItem;

  const _SellerSection({
    required this.group,
    required this.isEditMode,
    required this.loadingItems,
    required this.onUpdateQuantity,
    required this.onRemoveItem,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: AppColors.background,
        border: Border(bottom: BorderSide(color: AppColors.border, width: 1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Seller header
          SellerHeader(
            sellerName: group.sellerName,
            sellerPhotoUrl: group.sellerPhotoUrl,
            isTrustedSeller: group.isTrustedSeller,
          ),
          const SizedBox(height: 19),

          // Items
          ...group.items.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            final itemKey = '${item.variationId}_${item.skuId}';
            final isLoading = loadingItems[itemKey] ?? false;

            return Column(
              children: [
                CartItemTile(
                  item: item,
                  isLoading: isLoading,
                  isEditMode: isEditMode,
                  onDecrement: () => onUpdateQuantity(item, item.quantity - 1),
                  onIncrement: () => onUpdateQuantity(item, item.quantity + 1),
                  onRemove: () => onRemoveItem(item),
                ),
                // Add divider between items (but not after the last one)
                if (index < group.items.length - 1)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 19),
                    child: Container(height: 1, color: AppColors.secondary),
                  ),
              ],
            );
          }),

          // Seller unavailable message
          if (group.hasUnavailableItems) ...[
            const SizedBox(height: 19),
            SellerUnavailableMessage(
              message: group.isSellerOnVacation
                  ? "The seller can't ship these items at this time."
                  : "Some items are out of stock.",
            ),
          ],
        ],
      ),
    );
  }
}
