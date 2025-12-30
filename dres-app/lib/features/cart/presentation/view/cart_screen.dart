import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/cart/data/repositories/cart_repository.dart';
import 'package:dres/features/cart/data/models/seller_group.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_bloc.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_state.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_event.dart';
import 'package:dres/features/cart/presentation/widgets/cart_header.dart';
import 'package:dres/features/cart/presentation/widgets/seller_header.dart';
import 'package:dres/features/cart/presentation/widgets/cart_item_tile.dart';
import 'package:dres/features/cart/presentation/widgets/seller_unavailable_message.dart';
import 'package:dres/features/cart/presentation/widgets/cart_summary.dart';

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

  @override
  void initState() {
    super.initState();
    // Refresh cart when screen opens
    context.read<CartBloc>().add(const CartFetchRequested());
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
    final previousQuantity = _getDisplayQuantity(item);
    
    // Optimistic update - update UI immediately
    setState(() {
      if (newQuantity < 1) {
        _optimisticQuantities.remove(itemKey);
      } else {
        _optimisticQuantities[itemKey] = newQuantity;
      }
      _loadingItems[itemKey] = true;
    });

    try {
      final cartRepository = getIt<CartRepository>();

      if (newQuantity < 1) {
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
          quantity: newQuantity,
        );
      }

      if (mounted) {
        // Fetch updated cart - will clear optimistic state on success
        context.read<CartBloc>().add(const CartFetchRequested());
        // Clear optimistic quantity after successful update
        setState(() {
          _optimisticQuantities.remove(itemKey);
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
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update cart: ${e.toString()}'),
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
        context.read<CartBloc>().add(const CartFetchRequested());
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to remove item'),
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
            final hasUnavailableItems = sellerGroups.any(
              (group) => group.hasUnavailableItems,
            );

            return Column(
              children: [
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
                  hasUnavailableItems: hasUnavailableItems,
                  onNextPressed: () {
                    // TODO: Navigate to checkout
                  },
                ),
              ],
            );
          },
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
                Icon(
                  Icons.shopping_bag_outlined,
                  size: 64,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(height: 16),
                Text(
                  'Your bag is empty',
                  style: AppTypography.bodyL.copyWith(
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
