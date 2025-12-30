import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/app_text_field.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/cart/data/models/shipping_address.dart';
import 'package:dres/features/cart/data/repositories/location_repository.dart';
import 'package:dres/features/cart/logic/address_bloc/address_bloc.dart';
import 'package:dres/features/cart/presentation/widgets/location_picker_sheet.dart';

class AddAddressScreen extends StatefulWidget {
  /// If provided, we're editing an existing address
  final ShippingAddress? addressToEdit;

  const AddAddressScreen({
    super.key,
    this.addressToEdit,
  });

  @override
  State<AddAddressScreen> createState() => _AddAddressScreenState();
}

class _AddAddressScreenState extends State<AddAddressScreen> {
  final _formKey = GlobalKey<FormState>();
  final _labelController = TextEditingController();
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _deliveryNoteController = TextEditingController();
  
  // Selected location
  CityModel? _selectedCity;
  
  bool _isLoading = false;

  bool get _isEditing => widget.addressToEdit != null;

  @override
  void initState() {
    super.initState();
    // Pre-fill fields if editing
    if (widget.addressToEdit != null) {
      final addr = widget.addressToEdit!;
      _labelController.text = addr.label;
      _fullNameController.text = addr.fullName;
      _phoneController.text = addr.phone;
      _deliveryNoteController.text = addr.deliveryNotes ?? '';
      
      // Create a CityModel from the address data
      if (addr.cityId != null) {
        _selectedCity = CityModel(
          id: addr.cityId!,
          name: addr.cityName ?? addr.address,
          countryId: addr.countryId,
          regionId: addr.regionId,
          regionName: addr.regionName,
        );
      }
    } else {
      // Default label for new addresses
      _labelController.text = 'Home';
    }
  }

  @override
  void dispose() {
    _labelController.dispose();
    _fullNameController.dispose();
    _phoneController.dispose();
    _deliveryNoteController.dispose();
    super.dispose();
  }

  void _selectLocation() async {
    final city = await LocationPickerSheet.show(
      context,
      selectedCity: _selectedCity,
    );
    
    if (city != null) {
      setState(() {
        _selectedCity = city;
      });
    }
  }

  Future<void> _saveAddress() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_selectedCity == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a location'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final address = ShippingAddress(
        id: widget.addressToEdit?.id, // Keep ID if editing
        label: _labelController.text.trim(),
        fullName: _fullNameController.text.trim(),
        phone: _phoneController.text.trim(),
        address: _selectedCity!.name,
        countryId: _selectedCity!.countryId,
        cityId: _selectedCity!.id,
        cityName: _selectedCity!.name,
        regionId: _selectedCity!.regionId,
        regionName: _selectedCity!.regionName,
        deliveryNotes: _deliveryNoteController.text.trim().isNotEmpty 
            ? _deliveryNoteController.text.trim() 
            : null,
        isDefault: widget.addressToEdit?.isDefault ?? true,
      );

      if (_isEditing) {
        // Update existing address
        await getIt<AddressBloc>().addressRepository.updateAddress(address);
        getIt<AddressBloc>().add(const AddressFetchRequested());
      } else {
        // Add new address
        await getIt<AddressBloc>().addressRepository.addAddress(address);
        getIt<AddressBloc>().add(const AddressFetchRequested());
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditing ? 'Address updated successfully' : 'Address saved successfully'),
            backgroundColor: AppColors.success,
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save address: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final locationDisplay = _selectedCity != null
        ? _selectedCity!.name
        : 'Select location';

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
              context.go('/addresses');
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
          _isEditing ? 'Edit Address' : 'Add Address',
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
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            // Location selector
            GestureDetector(
              onTap: _selectLocation,
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  color: AppColors.background,
                  border: Border(
                    bottom: BorderSide(
                      color: AppColors.secondary,
                      width: 1,
                    ),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      locationDisplay,
                      style: AppTypography.bodyL.copyWith(
                        color: _selectedCity != null
                            ? AppColors.textPrimary
                            : AppColors.textHint,
                      ),
                    ),
                    Icon(
                      PhosphorIcons.caretRight(),
                      size: 14,
                      color: AppColors.textPrimary,
                    ),
                  ],
                ),
              ),
            ),

            // Form fields
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Label field (Home, Work, etc.)
                    AppTextField(
                      label: 'Label',
                      hintText: 'E.g. Home, Work, Office...',
                      controller: _labelController,
                      textCapitalization: TextCapitalization.words,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter a label';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),

                    // Full name field
                    AppTextField(
                      label: 'Full name',
                      controller: _fullNameController,
                      textCapitalization: TextCapitalization.words,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter your full name';
                        }
                        if (value.trim().length < 2) {
                          return 'Name must be at least 2 characters';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),

                    // Phone number field
                    AppTextField(
                      label: 'Phone number',
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter your phone number';
                        }
                        // Basic phone validation - at least 10 digits
                        final digitsOnly = value.replaceAll(RegExp(r'[^\d]'), '');
                        if (digitsOnly.length < 10) {
                          return 'Please enter a valid phone number';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),

                    // Delivery note field
                    AppTextField(
                      label: 'Delivery note (optional)',
                      hintText: 'E.g. Ring the bell, leave at door...',
                      controller: _deliveryNoteController,
                      textCapitalization: TextCapitalization.sentences,
                      maxLines: 3,
                      minLines: 2,
                    ),
                  ],
                ),
              ),
            ),

            // Save button
            Padding(
              padding: const EdgeInsets.all(20),
              child: AppButton.filled(
                text: _isEditing ? 'Update Address' : 'Save Address',
                onPressed: _isLoading ? null : _saveAddress,
                isFullWidth: true,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
