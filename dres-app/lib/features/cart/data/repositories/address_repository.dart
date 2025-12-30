import 'package:flutter/foundation.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/cart/data/models/shipping_address.dart';

export 'package:dres/features/cart/data/models/shipping_address.dart';

class AddressRepository {
  final ApiService _apiService;

  AddressRepository({required ApiService apiService}) : _apiService = apiService;

  /// Get user's shipping addresses
  Future<List<ShippingAddress>> getAddresses() async {
    final response = await _apiService.get(
      '/users/me',
      queryParameters: {
        'depth': 2, // Populate country, region, city
      },
    );

    final data = response.data;
    debugPrint('📦 AddressRepository: Response data keys: ${data.keys}');
    
    // The /users/me endpoint returns user data inside a 'user' key
    final userData = data['user'] as Map<String, dynamic>? ?? data;
    debugPrint('📦 AddressRepository: User data keys: ${userData.keys}');
    debugPrint('📦 AddressRepository: addresses field: ${userData['addresses']}');
    
    final addressesRaw = userData['addresses'] as List? ?? [];
    debugPrint('📦 AddressRepository: Parsed ${addressesRaw.length} addresses');
    
    return _parseAddresses(addressesRaw);
  }

  /// Add a new shipping address using dedicated endpoint
  Future<List<ShippingAddress>> addAddress(ShippingAddress address) async {
    final response = await _apiService.post(
      '/users/addresses',
      data: address.toJson(),
    );

    final data = response.data;
    return _parseAddresses(data['addresses'] as List? ?? []);
  }

  /// Delete a shipping address by index
  Future<List<ShippingAddress>> deleteAddressByIndex(int index) async {
    final response = await _apiService.delete('/users/addresses/$index');

    final data = response.data;
    return _parseAddresses(data['addresses'] as List? ?? []);
  }

  /// Delete a shipping address by ID (finds index first)
  Future<List<ShippingAddress>> deleteAddress(String addressId) async {
    // First, try to parse as index (for backwards compatibility)
    final index = int.tryParse(addressId);
    if (index != null) {
      return deleteAddressByIndex(index);
    }
    
    // Otherwise, find the index by ID
    final addresses = await getAddresses();
    final foundIndex = addresses.indexWhere((addr) => addr.id == addressId);
    if (foundIndex == -1) {
      throw Exception('Address not found');
    }
    return deleteAddressByIndex(foundIndex);
  }

  /// Set an address as default by index
  Future<List<ShippingAddress>> setDefaultAddressByIndex(int index) async {
    final response = await _apiService.patch('/users/addresses/$index/default');

    final data = response.data;
    return _parseAddresses(data['addresses'] as List? ?? []);
  }

  /// Set an address as default by ID (finds index first)
  Future<List<ShippingAddress>> setDefaultAddress(String addressId) async {
    // First, try to parse as index (for backwards compatibility)
    final index = int.tryParse(addressId);
    if (index != null) {
      return setDefaultAddressByIndex(index);
    }
    
    // Otherwise, find the index by ID
    final addresses = await getAddresses();
    final foundIndex = addresses.indexWhere((addr) => addr.id == addressId);
    if (foundIndex == -1) {
      throw Exception('Address not found');
    }
    return setDefaultAddressByIndex(foundIndex);
  }

  /// Update an address by index
  Future<List<ShippingAddress>> updateAddressByIndex(int index, ShippingAddress address) async {
    final response = await _apiService.put(
      '/users/addresses/$index',
      data: address.toJson(),
    );

    final data = response.data;
    return _parseAddresses(data['addresses'] as List? ?? []);
  }

  /// Update an address by ID (finds index first)
  Future<List<ShippingAddress>> updateAddress(ShippingAddress address) async {
    if (address.id == null) {
      throw Exception('Address ID is required for update');
    }
    
    // First, try to parse as index (for backwards compatibility)
    final index = int.tryParse(address.id!);
    if (index != null) {
      return updateAddressByIndex(index, address);
    }
    
    // Otherwise, find the index by ID
    final addresses = await getAddresses();
    final foundIndex = addresses.indexWhere((addr) => addr.id == address.id);
    if (foundIndex == -1) {
      throw Exception('Address not found');
    }
    return updateAddressByIndex(foundIndex, address);
  }

  /// Get the default shipping address
  Future<ShippingAddress?> getDefaultAddress() async {
    final addresses = await getAddresses();
    return addresses.where((addr) => addr.isDefault).firstOrNull ?? 
           addresses.firstOrNull;
  }

  /// Helper to parse addresses list (keeps original IDs)
  List<ShippingAddress> _parseAddresses(List addressesRaw) {
    return addressesRaw
        .map((addr) => ShippingAddress.fromJson(Map<String, dynamic>.from(addr as Map)))
        .toList();
  }
}
