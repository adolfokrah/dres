import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/cart/data/repositories/address_repository.dart';
import 'address_event.dart';
import 'address_state.dart';

export 'address_event.dart';
export 'address_state.dart';

class AddressBloc extends Bloc<AddressEvent, AddressState> {
  final AddressRepository _addressRepository;

  /// Expose repository for direct access when needed
  AddressRepository get addressRepository => _addressRepository;

  AddressBloc({required AddressRepository addressRepository})
      : _addressRepository = addressRepository,
        super(const AddressState()) {
    on<AddressFetchRequested>(_onFetchRequested);
    on<AddressDeleteRequested>(_onDeleteRequested);
    on<AddressUpdateRequested>(_onUpdateRequested);
    on<AddressSetDefaultRequested>(_onSetDefaultRequested);
    on<AddressSelected>(_onAddressSelected);
  }

  Future<void> _onFetchRequested(
    AddressFetchRequested event,
    Emitter<AddressState> emit,
  ) async {
    emit(state.copyWith(status: AddressStatus.loading));

    try {
      debugPrint('🏠 AddressBloc: Fetching addresses...');
      final addresses = await _addressRepository.getAddresses();
      debugPrint('🏠 AddressBloc: Got ${addresses.length} addresses');
      for (final addr in addresses) {
        debugPrint('🏠 Address: ${addr.fullName} - ${addr.cityName} (id: ${addr.id})');
      }
      emit(state.copyWith(
        status: AddressStatus.success,
        addresses: addresses,
      ));
    } catch (e) {
      debugPrint('🏠 AddressBloc ERROR: $e');
      emit(state.copyWith(
        status: AddressStatus.failure,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onDeleteRequested(
    AddressDeleteRequested event,
    Emitter<AddressState> emit,
  ) async {
    emit(state.copyWith(status: AddressStatus.loading));

    try {
      debugPrint('🏠 AddressBloc: Deleting address ${event.addressId}...');
      final addresses = await _addressRepository.deleteAddress(event.addressId);
      debugPrint('🏠 AddressBloc: Address deleted, ${addresses.length} remaining');
      
      // Clear selected address if it was deleted
      final newSelectedId = state.selectedAddressId == event.addressId 
          ? null 
          : state.selectedAddressId;
      
      emit(state.copyWith(
        status: AddressStatus.success,
        addresses: addresses,
        selectedAddressId: newSelectedId,
      ));
    } catch (e) {
      debugPrint('🏠 AddressBloc DELETE ERROR: $e');
      emit(state.copyWith(
        status: AddressStatus.failure,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onUpdateRequested(
    AddressUpdateRequested event,
    Emitter<AddressState> emit,
  ) async {
    emit(state.copyWith(status: AddressStatus.loading));

    try {
      debugPrint('🏠 AddressBloc: Updating address ${event.address.id}...');
      final addresses = await _addressRepository.updateAddress(event.address);
      debugPrint('🏠 AddressBloc: Address updated');
      
      emit(state.copyWith(
        status: AddressStatus.success,
        addresses: addresses,
      ));
    } catch (e) {
      debugPrint('🏠 AddressBloc UPDATE ERROR: $e');
      emit(state.copyWith(
        status: AddressStatus.failure,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onSetDefaultRequested(
    AddressSetDefaultRequested event,
    Emitter<AddressState> emit,
  ) async {
    emit(state.copyWith(status: AddressStatus.loading));

    try {
      final addresses = await _addressRepository.setDefaultAddress(event.addressId);
      emit(state.copyWith(
        status: AddressStatus.success,
        addresses: addresses,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: AddressStatus.failure,
        errorMessage: e.toString(),
      ));
    }
  }

  void _onAddressSelected(
    AddressSelected event,
    Emitter<AddressState> emit,
  ) {
    emit(state.copyWith(selectedAddressId: event.addressId));
  }
}
