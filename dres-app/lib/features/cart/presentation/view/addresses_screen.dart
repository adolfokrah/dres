import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/cart/data/models/shipping_address.dart';
import 'package:dres/features/cart/logic/address_bloc/address_bloc.dart';

class AddressesScreen extends StatefulWidget {
  /// If true, user is selecting an address for checkout
  final bool isSelecting;

  const AddressesScreen({
    super.key,
    this.isSelecting = false,
  });

  @override
  State<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends State<AddressesScreen> {
  bool _isEditMode = false;

  @override
  void initState() {
    super.initState();
    // Fetch addresses when screen opens
    getIt<AddressBloc>().add(const AddressFetchRequested());
  }

  void _toggleEditMode() {
    setState(() {
      _isEditMode = !_isEditMode;
    });
  }

  void _deleteAddress(String addressId) {
    getIt<AddressBloc>().add(AddressDeleteRequested(addressId));
  }

  void _editAddress(ShippingAddress address) {
    context.push('/edit-address', extra: address);
  }

  void _selectAddress(ShippingAddress address) {
    if (widget.isSelecting && address.id != null) {
      getIt<AddressBloc>().add(AddressSelected(address.id!));
      context.pop(address);
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: getIt<AddressBloc>(),
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.background,
          elevation: 0,
          leading: GestureDetector(
            onTap: () {
              if (context.canPop()) {
                context.pop();
              } else {
                context.go('/home');
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
            'Addresses',
            style: AppTypography.bodyL.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
          actions: [
            BlocBuilder<AddressBloc, AddressState>(
              builder: (context, state) {
                if (state.addresses.isEmpty) {
                  return const SizedBox(width: 60);
                }
                return GestureDetector(
                  onTap: _toggleEditMode,
                  child: Padding(
                    padding: const EdgeInsets.only(right: 20),
                    child: Center(
                      child: Text(
                        _isEditMode ? 'DONE' : 'EDIT',
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ],
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(1),
            child: Container(
              color: AppColors.secondary,
              height: 1,
            ),
          ),
        ),
        body: BlocBuilder<AddressBloc, AddressState>(
          builder: (context, state) {
            if (state.status == AddressStatus.loading && state.addresses.isEmpty) {
              return const Center(child: CircularProgressIndicator());
            }

            if (state.addresses.isEmpty) {
              return Column(
                children: [
                  Expanded(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            PhosphorIcons.mapPin(),
                            size: 64,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No addresses yet',
                            style: AppTypography.titleL.copyWith(
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Add your first shipping address',
                            style: AppTypography.bodyM.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Add New Address button
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: AppButton.filled(
                      text: 'Add New Address',
                      onPressed: () {
                        context.push('/add-address');
                      },
                      isFullWidth: true,
                    ),
                  ),
                ],
              );
            }

            return Column(
              children: [
                // Addresses list
                Expanded(
                  child: ListView.builder(
                    itemCount: state.addresses.length,
                    itemBuilder: (context, index) {
                      final address = state.addresses[index];
                      return _AddressTile(
                        address: address,
                        isEditMode: _isEditMode,
                        onTap: () => _selectAddress(address),
                        onEdit: () => _editAddress(address),
                        onDelete: () {
                          if (address.id != null) {
                            _deleteAddress(address.id!);
                          }
                        },
                      );
                    },
                  ),
                ),

                // Add New Address button
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: AppButton.outlined(
                    text: 'Add New Address',
                    onPressed: () {
                      context.push('/add-address');
                    },
                    isFullWidth: true,
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _AddressTile extends StatelessWidget {
  final ShippingAddress address;
  final bool isEditMode;
  final VoidCallback? onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const _AddressTile({
    required this.address,
    this.isEditMode = false,
    this.onTap,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isEditMode ? onEdit : onTap,
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Delete button on left side in edit mode (red circle with minus)
            if (isEditMode) ...[
              GestureDetector(
                onTap: () => _showDeleteConfirmation(context),
                child: Container(
                  width: 23,
                  height: 24,
                  margin: const EdgeInsets.only(right: 10),
                  decoration: const BoxDecoration(
                    color: AppColors.error,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Icon(
                      PhosphorIcons.minus(),
                      size: 13,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],

            // Address info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Label and default badge
                  Row(
                    children: [
                      Text(
                        address.label,
                        style: AppTypography.bodyS.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      if (address.isDefault) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'Default',
                            style: AppTypography.bodyXS.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  // Full name
                  Text(
                    address.fullName,
                    style: AppTypography.bodyM.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  // Location (city - region)
                  Text(
                    address.locationDisplay.isNotEmpty 
                        ? address.locationDisplay 
                        : address.address,
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  // Phone
                  Text(
                    address.phone,
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                  // Delivery notes if present
                  if (address.deliveryNotes != null && address.deliveryNotes!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Note: ${address.deliveryNotes}',
                      style: AppTypography.bodyS.copyWith(
                        color: AppColors.textSecondary,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Chevron right or edit icon
            Icon(
              isEditMode ? PhosphorIcons.pencilSimple() : PhosphorIcons.caretRight(),
              size: isEditMode ? 18 : 14,
              color: AppColors.textPrimary,
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.zero,
        ),
        title: const Text('Delete Address'),
        content: Text('Are you sure you want to delete the address "${address.fullName}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              onDelete?.call();
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
