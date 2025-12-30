import 'package:dres/features/cart/data/models/cart_model.dart';

/// Groups cart items by seller for display
class SellerGroup {
  final String sellerId;
  final String sellerName;
  final String? sellerPhotoUrl;
  final bool isTrustedSeller;
  final bool isSellerOnVacation;
  final List<CartItemModel> items;

  SellerGroup({
    required this.sellerId,
    required this.sellerName,
    this.sellerPhotoUrl,
    this.isTrustedSeller = false,
    this.isSellerOnVacation = false,
    required this.items,
  });

  /// Check if any item in this group is unavailable
  bool get hasUnavailableItems =>
      isSellerOnVacation || items.any((item) => item.isUnavailable);

  /// Check if any item in this group exceeds available stock
  bool get hasExceedsStock =>
      items.any((item) => item.exceedsAvailableStock);

  /// Total price for this seller's items
  double get totalPrice {
    return items.fold(0.0, (sum, item) {
      final price = item.sku?.displayPrice ?? item.price ?? 0;
      return sum + (price * item.quantity);
    });
  }

  /// Total shipping for this seller's items
  double get totalShipping {
    return items.fold(0.0, (sum, item) => sum + item.shippingFee);
  }

  /// Total buyer protection fee for items that have it enabled
  double get totalBuyerProtection {
    return items.fold(0.0, (sum, item) {
      if (item.buyerProtection) {
        return sum + item.buyerProtectionFee;
      }
      return sum;
    });
  }

  /// Check if any item has buyer protection enabled
  bool get hasBuyerProtection {
    return items.any((item) => item.buyerProtection);
  }

  /// Group cart items by seller
  static List<SellerGroup> groupBySeller(List<CartItemModel> items) {
    final Map<String, SellerGroup> groups = {};

    for (final item in items) {
      final seller = item.variation?.seller;
      final sellerId = seller?.id ?? 'unknown';

      if (!groups.containsKey(sellerId)) {
        groups[sellerId] = SellerGroup(
          sellerId: sellerId,
          sellerName: seller?.displayName ?? 'Unknown Seller',
          sellerPhotoUrl: seller?.photoUrl,
          isTrustedSeller: seller?.isTrusted ?? false,
          isSellerOnVacation: seller?.isOnVacation ?? false,
          items: [],
        );
      }

      groups[sellerId]!.items.add(item);
    }

    return groups.values.toList();
  }
}
