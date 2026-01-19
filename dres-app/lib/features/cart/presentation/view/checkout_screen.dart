import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/payment/presentation/view/payment_screen.dart';
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
import 'package:dres/features/payment/data/repositories/payment_repository.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final TextEditingController _promoController = TextEditingController();
  String? _lastShippingCityId; // Track last city we calculated shipping for
  bool _isShowingErrorDialog = false; // Prevent duplicate error dialogs
  bool _initialShippingCalculated = false; // Track if initial shipping was calculated

  @override
  void initState() {
    super.initState();
    // Fetch cart and addresses when checkout screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Refresh cart to get latest validation/stock info
      getIt<CartBloc>().add(const CartFetchRequested());
      // Fetch addresses - shipping will be calculated when addresses load
      getIt<AddressBloc>().add(const AddressFetchRequested());
      
      // Also check if addresses are already loaded and trigger shipping calculation
      // Use a slight delay to ensure bloc listener is set up
      Future.delayed(const Duration(milliseconds: 200), () {
        if (mounted) {
          _checkAndCalculateInitialShipping();
        }
      });
    });
  }
  
  /// Check if addresses are already loaded and calculate shipping if needed
  void _checkAndCalculateInitialShipping() {
    final addressState = getIt<AddressBloc>().state;
    debugPrint('🚚 _checkAndCalculateInitialShipping: status=${addressState.status}, initialCalculated=$_initialShippingCalculated');
    
    if (addressState.status == AddressStatus.success && 
        addressState.selectedAddress?.cityId != null &&
        !_initialShippingCalculated) {
      _initialShippingCalculated = true;
      final cityId = addressState.selectedAddress!.cityId!;
      _lastShippingCityId = cityId;
      debugPrint('🚚 Checkout: Initial shipping calculation for city $cityId');
      getIt<CartBloc>().add(CartUpdateShippingRequested(cityId: cityId));
    }
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
      final orderDocId = state.placeOrderResponse?.order?.id;
      final transactionId = state.placeOrderResponse?.payment?.transactionId;
      
      if (paymentUrl != null && transactionId != null) {
        // Open payment screen with long polling
        final result = await openPaymentScreen(
          context,
          paymentUrl: paymentUrl,
          transactionId: transactionId,
          title: orderId != null ? 'Pay for $orderId' : 'Complete Payment',
        );
        
        if (!mounted) return;
        
        // Handle result from payment screen
        if (result == PaymentResult.success) {
          // Payment successful - clear cart and navigate to order
          getIt<CartBloc>().add(const CartCleared());
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Payment successful! Your order has been placed.'),
              backgroundColor: AppColors.success,
            ),
          );
          // Go to profile first (to have proper back stack), then push order details
          context.go('/profile');
          if (orderDocId != null) {
            context.push('/orders/$orderDocId');
          }
        } else if (result == PaymentResult.failed) {
          // Payment failed
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Payment failed. Please try again.'),
              backgroundColor: AppColors.error,
            ),
          );
          context.go('/cart');
        } else {
          // User closed manually - verify status
          await _verifyPaymentAndNavigate(transactionId, orderDocId);
        }
      }
    } else if (state.placeOrderStatus == PlaceOrderStatus.error) {
      // Prevent showing multiple dialogs
      if (_isShowingErrorDialog) {
        debugPrint('🚨 Already showing error dialog, skipping');
        return;
      }
      
      // Show ALL order errors in a dialog so they persist until dismissed
      // This is important because users need to understand why their order failed
      final errorMessage = state.placeOrderError ?? 'Failed to place order';
      
      debugPrint('🚨 Place order error: $errorMessage');
      debugPrint('🚨 Showing error dialog...');
      
      _isShowingErrorDialog = true;
      
      // Use addPostFrameCallback to ensure dialog shows after current frame
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) {
          _isShowingErrorDialog = false;
          return;
        }
        // Show error in a dialog - reset status AFTER dialog is dismissed
        showDialog(
          context: context,
          barrierDismissible: false, // User must tap OK
          builder: (dialogContext) => AlertDialog(
            shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
            backgroundColor: AppColors.surface,
            title: Row(
              children: [
                PhosphorIcon(
                  PhosphorIconsRegular.warning,
                  color: AppColors.error,
                  size: 24,
                ),
                const SizedBox(width: 8),
                Text(
                  'Order Issue',
                  style: AppTypography.titleLM.copyWith(color: AppColors.textPrimary),
                ),
              ],
            ),
            content: Text(
              errorMessage,
              style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  debugPrint('🚨 Dialog OK pressed - dismissing');
                  Navigator.of(dialogContext).pop();
                },
                child: Text(
                  'OK',
                  style: AppTypography.bodyM.copyWith(color: AppColors.primary),
                ),
              ),
            ],
          ),
        ).then((_) {
          debugPrint('🚨 Dialog dismissed - resetting state');
          _isShowingErrorDialog = false;
          if (!mounted) return;
          // Reset status and refresh cart AFTER dialog is dismissed
          getIt<CartBloc>().add(const CartPlaceOrderReset());
          getIt<CartBloc>().add(const CartFetchRequested());
        });
      });
    }
  }

  Future<void> _verifyPaymentAndNavigate(String transactionId, String? orderId) async {
    if (!mounted) return;
    
    // Show loading indicator
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => const Center(
        child: CircularProgressIndicator(),
      ),
    );
    
    try {
      final response = await getIt<PaymentRepository>().checkTransactionStatus(
        reference: transactionId,
      );
      
      if (!mounted) return;
      Navigator.of(context).pop(); // Close loading dialog
      
      if (response.isPaymentSuccessful) {
        // Payment successful - clear cart and navigate to order
        getIt<CartBloc>().add(const CartCleared());
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment successful! Your order has been placed.'),
            backgroundColor: AppColors.success,
          ),
        );
        // Navigate to order details - go to profile first for proper back stack
        context.go('/profile');
        if (orderId != null) {
          context.push('/orders/$orderId');
        }
      } else if (response.isPaymentFailed) {
        // Payment failed
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response.message.isNotEmpty 
                ? response.message 
                : 'Payment failed. Please try again.'),
            backgroundColor: AppColors.error,
          ),
        );
        context.go('/cart');
      } else if (response.isPaymentPending) {
        // Still processing - go to profile where orders are accessible
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment is still processing. Please check your orders.'),
            backgroundColor: AppColors.warning,
          ),
        );
        context.go('/profile');
      } else {
        // Unknown status - go to profile where orders are accessible
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please check your orders for payment status.'),
            backgroundColor: AppColors.warning,
          ),
        );
        context.go('/profile');
      }
    } catch (e) {
      if (!mounted) return;
      Navigator.of(context).pop(); // Close loading dialog
      
      debugPrint('Error verifying payment: $e');
      // On error, go to profile where orders are accessible
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not verify payment. Please check your orders.'),
          backgroundColor: AppColors.warning,
        ),
      );
      context.go('/profile');
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
            listenWhen: (previous, current) {
              // Listen when status becomes success OR when selected address changes
              final statusBecameSuccess = previous.status != AddressStatus.success && 
                  current.status == AddressStatus.success;
              final addressChanged = previous.selectedAddress?.cityId != current.selectedAddress?.cityId;
              return statusBecameSuccess || addressChanged;
            },
            listener: (context, addressState) {
              // When addresses are loaded or changed, update shipping if there's a selected address
              final selectedAddress = addressState.selectedAddress;
              debugPrint('🚚 AddressBloc listener: status=${addressState.status}, selectedCity=${selectedAddress?.cityId}, lastCity=$_lastShippingCityId');
              
              if (addressState.status == AddressStatus.success &&
                  selectedAddress != null && 
                  selectedAddress.cityId != null && 
                  selectedAddress.cityId != _lastShippingCityId) {
                // City changed or first load - update shipping fees
                _lastShippingCityId = selectedAddress.cityId;
                _initialShippingCalculated = true;
                debugPrint('🚚 Checkout: Address changed/loaded, updating shipping for city ${selectedAddress.cityId}');
                // Small delay to avoid race conditions with cart fetch
                Future.delayed(const Duration(milliseconds: 100), () {
                  if (mounted) {
                    getIt<CartBloc>().add(CartUpdateShippingRequested(cityId: selectedAddress.cityId!));
                  }
                });
              }
            },
            child: BlocListener<CartBloc, CartState>(
            listenWhen: (previous, current) {
              debugPrint('🔔 listenWhen: prev=${previous.placeOrderStatus}, curr=${current.placeOrderStatus}');
              // Only listen when status changes TO success or error (not FROM them)
              if (previous.placeOrderStatus != current.placeOrderStatus) {
                // Only trigger when transitioning TO success or error
                final shouldListen = current.placeOrderStatus == PlaceOrderStatus.success ||
                       current.placeOrderStatus == PlaceOrderStatus.error;
                debugPrint('🔔 Status changed, shouldListen=$shouldListen');
                return shouldListen;
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
              debugPrint('🔔 Listener called: placeOrderStatus=${cartState.placeOrderStatus}');
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
                // Don't clear existing snackbars - they might be important error messages
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
              // Show loading while fetching cart initially
              if (cartState.status == CartStatus.loading && cartState.cart == null) {
                return const Center(child: CircularProgressIndicator());
              }

              // Don't show empty checkout if we're in the middle of placing an order
              // (the cart might be clearing)
              final isPlacingOrder = cartState.placeOrderStatus == PlaceOrderStatus.loading ||
                  cartState.placeOrderStatus == PlaceOrderStatus.success;

              if ((cartState.cart == null || cartState.items.isEmpty) && !isPlacingOrder) {
                return _EmptyCheckout();
              }

              // If cart is empty but we're processing order, show loading
              if (cartState.items.isEmpty && isPlacingOrder) {
                return const Center(child: CircularProgressIndicator());
              }

              final sellerGroups = SellerGroup.groupBySeller(cartState.items);

              // Use validation from backend
              final hasValidItems = cartState.isValid;
              final validationReason = cartState.validationReason;
              // Check if validation error is shipping-related (shown at seller level, not here)
              final hasShippingError = cartState.hasShippingError;
              // Only show top-level warning for item errors (not shipping errors)
              final hasItemErrors = !hasValidItems && !hasShippingError;

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

                  // Show loading bar when cart is loading/updating or placing order
                  final isLoading = cartState.status == CartStatus.loading ||
                      cartState.placeOrderStatus == PlaceOrderStatus.loading ||
                      isLoadingAddress;

                  return Column(
                    children: [
                      // Loading bar at top when processing
                      if (isLoading)
                        const LinearProgressIndicator(
                          backgroundColor: AppColors.secondary,
                          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                        ),

                      // Scrollable content
                      Expanded(
                        child: SingleChildScrollView(
                          child: Column(
                            children: [
                              // Warning banner if items have issues (not shipping errors - those show at seller level)
                              if (hasItemErrors)
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(16),
                                  color: AppColors.warning.withOpacity(0.1),
                                  child: Row(
                                    children: [
                                      PhosphorIcon(
                                        PhosphorIconsRegular.warning,
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
                                    hasShippingUnavailable: group.hasShippingUnavailable,
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
                                isLoading: cartState.promoStatus == PromoStatus.loading,
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
                      // Disable button when:
                      // - No address selected
                      // - Cart has invalid items
                      // - Cart is loading
                      // - Place order is loading or has error (until dialog dismissed)
                      CheckoutBottomBar(
                        grandTotal: grandTotal,
                        onPlaceOrder: _placeOrder,
                        canPlaceOrder: selectedAddress != null && 
                            hasValidItems && 
                            cartState.status != CartStatus.loading &&
                            cartState.placeOrderStatus != PlaceOrderStatus.loading &&
                            cartState.placeOrderStatus != PlaceOrderStatus.error,
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
            PhosphorIcon(
              PhosphorIconsRegular.shoppingCart,
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
