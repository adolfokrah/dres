import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/payment_webview_screen.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/cart/data/models/seller_group.dart';
import 'package:dres/features/cart/data/models/shipping_address.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_bloc.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_state.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_event.dart';
import 'package:dres/features/cart/logic/address_bloc/address_bloc.dart';
import 'package:dres/features/cart/presentation/widgets/shipping_section.dart';
import 'package:dres/features/cart/presentation/widgets/seller_checkout_card.dart';
import 'package:dres/features/cart/presentation/widgets/promo_code_section.dart';
import 'package:dres/features/cart/presentation/widgets/order_summary_section.dart';
import 'package:dres/features/cart/presentation/widgets/checkout_bottom_bar.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final TextEditingController _promoController = TextEditingController();
  String? _lastShippingCityId; // Track last city we calculated shipping for

  @override
  void initState() {
    super.initState();
    // Fetch cart and addresses when checkout screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Refresh cart to get latest validation/stock info
      getIt<CartBloc>().add(const CartFetchRequested());
      // Fetch addresses
      getIt<AddressBloc>().add(const AddressFetchRequested());
    });
  }

  @override
  void dispose() {
    _promoController.dispose();
    super.dispose();
  }

  void _applyPromoCode() {
    final code = _promoController.text.trim();
    if (code.isEmpty) return;
    
    // Use CartBloc to apply promo code
    getIt<CartBloc>().add(CartApplyPromoRequested(code: code));
  }

  void _placeOrder() {
    // Get selected address from AddressBloc
    final addressState = getIt<AddressBloc>().state;
    final selectedAddress = addressState.selectedAddress;
    
    if (selectedAddress?.id == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a shipping address'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }
    
    // Dispatch place order event
    getIt<CartBloc>().add(CartPlaceOrderRequested(
      shippingAddressId: selectedAddress!.id!,
    ));
  }

  void _handlePlaceOrderResult(CartState state) async {
    if (state.placeOrderStatus == PlaceOrderStatus.success) {
      final paymentUrl = state.paymentUrl;
      final orderId = state.placeOrderResponse?.order?.orderId;
      
      if (paymentUrl != null) {
        // Open payment webview
        final result = await openPaymentWebView(
          context,
          paymentUrl: paymentUrl,
          orderId: orderId,
        );
        
        if (result == PaymentResult.success) {
          // Payment completed - clear cart and navigate
          getIt<CartBloc>().add(const CartCleared());
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Payment successful! Your order has been placed.'),
                backgroundColor: AppColors.success,
              ),
            );
            // Navigate to orders or home
            context.go('/orders');
          }
        } else if (result == PaymentResult.cancelled) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Payment cancelled. Your order is still pending.'),
                backgroundColor: AppColors.warning,
              ),
            );
            // Go back to cart - user can try again or view pending order
            context.go('/cart');
          }
        }
      }
    } else if (state.placeOrderStatus == PlaceOrderStatus.error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.placeOrderError ?? 'Failed to place order'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: GestureDetector(
          onTap: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/cart');
            }
          },
          child: Icon(
            PhosphorIcons.caretLeft(),
            size: 20,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
        title: Text(
          'Checkout',
          style: AppTypography.bodyL.copyWith(
            color: AppColors.textPrimary,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: AppColors.secondary,
            height: 1,
          ),
        ),
      ),
      body: SafeArea(
        top: false,
        child: BlocProvider.value(
          value: getIt<AddressBloc>(),
          child: BlocListener<AddressBloc, AddressState>(
            listener: (context, addressState) {
              // When addresses are loaded or changed, update shipping if there's a selected address
              final selectedAddress = addressState.selectedAddress;
              if (selectedAddress != null && 
                  selectedAddress.cityId != null && 
                  selectedAddress.cityId != _lastShippingCityId) {
                // City changed - update shipping fees
                _lastShippingCityId = selectedAddress.cityId;
                getIt<CartBloc>().add(CartUpdateShippingRequested(cityId: selectedAddress.cityId!));
              }
            },
            child: BlocListener<CartBloc, CartState>(
            listenWhen: (previous, current) {
              // Listen for place order status changes
              if (previous.placeOrderStatus != current.placeOrderStatus) {
                return true;
              }
              // Only listen for promo changes when NOT placing order AND when message actually changed
              if (current.placeOrderStatus == PlaceOrderStatus.initial) {
                final promoMessageChanged = previous.promoMessage != current.promoMessage && current.promoMessage != null;
                final promoErrorChanged = previous.promoError != current.promoError && current.promoError != null;
                return promoMessageChanged || promoErrorChanged;
              }
              return false;
            },
            listener: (context, cartState) {
              // Handle place order result
              if (cartState.placeOrderStatus == PlaceOrderStatus.success ||
                  cartState.placeOrderStatus == PlaceOrderStatus.error) {
                _handlePlaceOrderResult(cartState);
                return;
              }
              
              // Don't show promo messages during place order flow (loading state)
              if (cartState.placeOrderStatus != PlaceOrderStatus.initial) {
                return;
              }
              
              // Show promo success message
              if (cartState.promoMessage != null) {
                ScaffoldMessenger.of(context).clearSnackBars();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(cartState.promoMessage!),
                    backgroundColor: AppColors.success,
                    duration: const Duration(seconds: 2),
                  ),
                );
              }
              // Show promo error message
              if (cartState.promoError != null) {
                ScaffoldMessenger.of(context).clearSnackBars();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(cartState.promoError!),
                    backgroundColor: AppColors.error,
                    duration: const Duration(seconds: 3),
                  ),
                );
              }
            },
            child: BlocBuilder<CartBloc, CartState>(
            builder: (context, cartState) {
              if (cartState.status == CartStatus.loading && cartState.cart == null) {
                return const Center(child: CircularProgressIndicator());
              }

              if (cartState.cart == null || cartState.items.isEmpty) {
                return _EmptyCheckout();
              }

              final sellerGroups = SellerGroup.groupBySeller(cartState.items);

              // Use validation from backend
              final hasValidItems = cartState.isValid;
              final validationReason = cartState.validationReason;

              // Calculate totals from actual cart data
              final itemsTotal = sellerGroups.fold(
                0.0,
                (sum, group) => sum + group.totalPrice,
              );
              // Get shipping from actual cart items (set by seller rates)
              final totalShipping = sellerGroups.fold(
                0.0,
                (sum, group) => sum + group.totalShipping,
              );
              // Calculate buyer protection from actual cart items
              final totalBuyerProtection = sellerGroups.fold(
                0.0,
                (sum, group) => sum + group.totalBuyerProtection,
              );
              // Use discount from cart state (from backend)
              final discountAmount = cartState.discountAmount;
              final grandTotal = itemsTotal +
                  totalShipping +
                  totalBuyerProtection -
                  discountAmount;

              return BlocBuilder<AddressBloc, AddressState>(
                builder: (context, addressState) {
                  final selectedAddress = addressState.selectedAddress;
                  final isLoadingAddress = addressState.status == AddressStatus.loading;
                  
                  return Column(
                    children: [
                      // Scrollable content
                      Expanded(
                        child: SingleChildScrollView(
                          child: Column(
                            children: [
                              // Warning banner if items have issues
                              if (!hasValidItems)
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(16),
                                  color: AppColors.warning.withOpacity(0.1),
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.warning_amber_rounded,
                                        color: AppColors.warning,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Text(
                                          validationReason ?? 'Some items require attention. Please update your cart.',
                                          style: AppTypography.bodyS.copyWith(
                                            color: AppColors.warning,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                              // Shipping section
                              ShippingSection(
                                customerName: isLoadingAddress 
                                    ? 'Loading...' 
                                    : (selectedAddress?.fullName ?? 'Select address'),
                                address: isLoadingAddress 
                                    ? 'Fetching addresses...'
                                    : (selectedAddress?.locationDisplay ?? 'Tap to add shipping address'),
                                phone: isLoadingAddress ? null : selectedAddress?.phone,
                                onTap: isLoadingAddress ? null : () async {
                                  final result = await context.push<ShippingAddress>('/addresses?selecting=true');
                                  if (result != null && result.id != null) {
                                    getIt<AddressBloc>().add(AddressSelected(result.id!));
                                    // Update shipping fees based on selected city
                                    if (result.cityId != null) {
                                      getIt<CartBloc>().add(CartUpdateShippingRequested(cityId: result.cityId!));
                                    }
                                  }
                                },
                              ),

                              // Seller checkout cards
                              ...sellerGroups.map((group) => SellerCheckoutCard(
                                    sellerName: group.sellerName,
                                    sellerPhotoUrl: group.sellerPhotoUrl,
                                    isTrustedSeller: group.isTrustedSeller,
                                    items: group.items,
                                    shippingFee: group.totalShipping,
                                    buyerProtectionFee: group.totalBuyerProtection,
                                    hasBuyerProtection: group.hasBuyerProtection,
                                    onLearnMoreTap: () {
                                      context.push('/direct-shipping-info');
                                    },
                                  )),

                              // Promo code section
                              PromoCodeSection(
                                controller: _promoController,
                                onApply: _applyPromoCode,
                                appliedCode: cartState.appliedPromoCode,
                                discountAmount: discountAmount,
                                isLoading: cartState.status == CartStatus.loading,
                              ),

                              // Order summary breakdown
                              OrderSummarySection(
                                itemCount: cartState.itemCount,
                                itemsTotal: itemsTotal,
                                discount: discountAmount,
                                shipping: totalShipping,
                                buyerProtection: totalBuyerProtection,
                                items: cartState.items,
                              ),
                              
                              // Bottom spacing for the sticky bar
                              const SizedBox(height: 20),
                            ],
                          ),
                        ),
                      ),
                      
                      // Sticky bottom bar with grand total and place order button
                      CheckoutBottomBar(
                        grandTotal: grandTotal,
                        onPlaceOrder: _placeOrder,
                        canPlaceOrder: selectedAddress != null && hasValidItems,
                        isLoading: cartState.placeOrderStatus == PlaceOrderStatus.loading,
                      ),
                    ],
                  );
                },
              );
            },
            ),
          ),
          ),
        ),
      ),
    );
  }
}

class _EmptyCheckout extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.shopping_cart_outlined,
              size: 64,
              color: AppColors.textHint,
            ),
            const SizedBox(height: 16),
            Text(
              'Your cart is empty',
              style: AppTypography.titleL.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Add items to your cart to checkout',
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            AppButton.filled(
              text: 'Start Shopping',
              onPressed: () => context.go('/discover'),
              isFullWidth: true,
            ),
          ],
        ),
      ),
    );
  }
}
