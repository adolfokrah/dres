import 'package:equatable/equatable.dart';
import 'package:dres/features/cart/data/models/shipping_address.dart';

abstract class AddressEvent extends Equatable {
  const AddressEvent();

  @override
  List<Object?> get props => [];
}

/// Fetch all addresses
class AddressFetchRequested extends AddressEvent {
  const AddressFetchRequested();
}

/// Delete an address
class AddressDeleteRequested extends AddressEvent {
  final String addressId;

  const AddressDeleteRequested(this.addressId);

  @override
  List<Object?> get props => [addressId];
}

/// Update an address
class AddressUpdateRequested extends AddressEvent {
  final ShippingAddress address;

  const AddressUpdateRequested(this.address);

  @override
  List<Object?> get props => [address];
}

/// Set an address as default
class AddressSetDefaultRequested extends AddressEvent {
  final String addressId;

  const AddressSetDefaultRequested(this.addressId);

  @override
  List<Object?> get props => [addressId];
}

/// Select an address (for checkout)
class AddressSelected extends AddressEvent {
  final String addressId;

  const AddressSelected(this.addressId);

  @override
  List<Object?> get props => [addressId];
}

/// Clear address state (e.g., on logout)
class AddressClearRequested extends AddressEvent {
  const AddressClearRequested();
}
