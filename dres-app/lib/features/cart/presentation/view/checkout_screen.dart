import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_button.dart';
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

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final TextEditingController _promoController = TextEditingController();
  String? _appliedPromoCode;
  double _discountAmount = 0.0;
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
    final code = _promoController.text.trim().toLowerCase();
    if (code == 'welcome') {
      setState(() {
        _appliedPromoCode = code;
        _discountAmount = 90.0; // Example discount
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Promo code applied successfully!'),
          backgroundColor: AppColors.success,
        ),
      );
    } else if (code.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Invalid promo code'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _placeOrder() {
    // TODO: Implement order placement logic
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Processing your order...'),
        backgroundColor: AppColors.primary,
      ),
    );
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
              final subtotal = itemsTotal +
                  totalShipping +
                  totalBuyerProtection -
                  _discountAmount;

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
                                      // TODO: Show buyer protection info
                                    },
                                  )),

                              // Promo code section
                              PromoCodeSection(
                                controller: _promoController,
                                onApply: _applyPromoCode,
                                appliedCode: _appliedPromoCode,
                              ),

                              // Order summary
                              OrderSummarySection(
                                itemCount: cartState.itemCount,
                                itemsTotal: itemsTotal,
                                discount: _discountAmount,
                                shipping: totalShipping,
                                buyerProtection: totalBuyerProtection,
                                subtotal: subtotal,
                                onPlaceOrder: _placeOrder,
                                canPlaceOrder: selectedAddress != null && hasValidItems,
                              ),
                            ],
                          ),
                        ),
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
