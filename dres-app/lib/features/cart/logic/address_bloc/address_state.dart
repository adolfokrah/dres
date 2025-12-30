import 'package:equatable/equatable.dart';
import 'package:dres/features/cart/data/models/shipping_address.dart';

enum AddressStatus { initial, loading, success, failure }

class AddressState extends Equatable {
  final AddressStatus status;
  final List<ShippingAddress> addresses;
  final String? selectedAddressId;
  final String? errorMessage;

  const AddressState({
    this.status = AddressStatus.initial,
    this.addresses = const [],
    this.selectedAddressId,
    this.errorMessage,
  });

  /// Get the selected address or default
  ShippingAddress? get selectedAddress {
    if (addresses.isEmpty) return null;
    
    // First try to find selected address
    if (selectedAddressId != null) {
      final selected = addresses.where((a) => a.id == selectedAddressId).firstOrNull;
      if (selected != null) return selected;
    }
    
    // Then try default address
    final defaultAddress = addresses.where((a) => a.isDefault).firstOrNull;
    if (defaultAddress != null) return defaultAddress;
    
    // Finally return first address
    return addresses.first;
  }

  AddressState copyWith({
    AddressStatus? status,
    List<ShippingAddress>? addresses,
    String? selectedAddressId,
    String? errorMessage,
  }) {
    return AddressState(
      status: status ?? this.status,
      addresses: addresses ?? this.addresses,
      selectedAddressId: selectedAddressId ?? this.selectedAddressId,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, addresses, selectedAddressId, errorMessage];
}
