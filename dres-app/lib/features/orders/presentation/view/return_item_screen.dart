import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/utilities/image_picker_utils.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/services/api_exception.dart';
import 'package:dres/features/orders/data/models/order_model.dart';
import 'package:dres/features/orders/data/repositories/orders_repository.dart';

/// Return reasons matching backend options
enum ReturnReason {
  wrongItem('wrong_item', 'Wrong item sent'),
  fakeItem('fake_item', 'Fake / Not Authentic'),
  damaged('damaged', 'Item arrived damaged'),
  notAsDescribed('not_as_described', 'Item not as described');

  const ReturnReason(this.value, this.label);
  final String value;
  final String label;
}

/// Screen for returning an order item
class ReturnItemScreen extends StatefulWidget {
  final String orderId;
  final String itemId;

  const ReturnItemScreen({
    super.key,
    required this.orderId,
    required this.itemId,
  });

  @override
  State<ReturnItemScreen> createState() => _ReturnItemScreenState();
}

class _ReturnItemScreenState extends State<ReturnItemScreen> {
  ReturnReason? _selectedReason = ReturnReason.wrongItem;
  File? _selectedImage;
  bool _isSubmitting = false;
  OrderItemModel? _item;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadOrderItem();
  }

  Future<void> _loadOrderItem() async {
    try {
      final order = await getIt<OrdersRepository>().getOrderById(widget.orderId);
      final item = order.items.firstWhere(
        (i) => i.id == widget.itemId,
        orElse: () => throw Exception('Item not found'),
      );
      setState(() {
        _item = item;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(getErrorMessage(e))),
        );
      }
    }
  }

  Future<void> _pickImage() async {
    final file = await ImagePickerUtils.pickSingleImage(context);
    if (file != null) {
      setState(() {
        _selectedImage = file;
      });
    }
  }

  Future<void> _submitReturn() async {
    if (_selectedReason == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please select a reason for the return'),
          backgroundColor: AppColors.textPrimary,
        ),
      );
      return;
    }

    if (_selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please attach an image as evidence'),
          backgroundColor: AppColors.textPrimary,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await getIt<OrdersRepository>().requestReturn(
        orderId: widget.orderId,
        itemId: widget.itemId,
        reason: _selectedReason!.value,
        image: _selectedImage!,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Return request submitted successfully'),
            backgroundColor: Colors.green,
          ),
        );
        context.pop(true); // Return true to indicate success
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(getErrorMessage(e)),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _buildAppBar(),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _item == null
              ? _buildErrorState()
              : _buildContent(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: AppColors.background,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      leading: IconButton(
        icon: Icon(
          PhosphorIcons.caretLeft(),
          color: AppColors.textPrimary,
          size: 20,
        ),
        onPressed: () => context.pop(),
      ),
      title: Text(
        'Report Product',
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
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Item not found',
            style: AppTypography.bodyL.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('Go back'),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    final item = _item!;
    final brandName = item.variation?.style?.brand?.name ?? '';
    final variationTitle = item.variationTitle ?? '';
    final skuOption = item.skuOptionValue ?? '';
    final imageUrl = item.imageUrl;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product info section
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    border: Border(
                      bottom: BorderSide(color: AppColors.secondary, width: 1),
                    ),
                  ),
                  child: Row(
                    children: [
                      // Product image
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: AppColors.secondary,
                          image: imageUrl != null
                              ? DecorationImage(
                                  image: NetworkImage(imageUrl),
                                  fit: BoxFit.cover,
                                )
                              : null,
                        ),
                      ),
                      const SizedBox(width: 16),
                      // Product info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (brandName.isNotEmpty)
                              Text(
                                brandName.toUpperCase(),
                                style: AppTypography.bodyL.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            Text(
                              [
                                variationTitle.toUpperCase(),
                                if (skuOption.isNotEmpty) skuOption,
                                item.quantity.toString(),
                              ].where((s) => s.isNotEmpty).join('/'),
                              style: AppTypography.bodyM.copyWith(
                                color: AppColors.textPrimary,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Return notice
                Container(
                  margin: const EdgeInsets.all(20),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.secondary,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'You have 6 hours to package and ship the products. Failure to ship within 6 hours will result in the item being marked as delivered and refund will not be made.',
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),

                // Reason selection
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Choose from one of the reasons below why are you are returning this item',
                        style: AppTypography.bodyL.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 20),
                      // Radio options
                      ...ReturnReason.values.map((reason) => _buildReasonOption(reason)),
                    ],
                  ),
                ),

                // Attached image section
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      Text(
                        'Attached Image',
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textPrimary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      GestureDetector(
                        onTap: _pickImage,
                        child: _selectedImage != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.file(
                                  _selectedImage!,
                                  width: 195,
                                  height: 260,
                                  fit: BoxFit.cover,
                                ),
                              )
                            : Container(
                                width: 195,
                                height: 260,
                                decoration: BoxDecoration(
                                  color: AppColors.secondary,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: AppColors.textSecondary.withOpacity(0.3),
                                    width: 1,
                                  ),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      PhosphorIcons.camera(),
                                      size: 40,
                                      color: AppColors.textSecondary,
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'Tap to add image',
                                      style: AppTypography.bodyM.copyWith(
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 30),
              ],
            ),
          ),
        ),

        // Submit button
        Container(
          padding: const EdgeInsets.all(20),
          child: AppButton.filled(
            text: 'Create a return',
            onPressed: _isSubmitting ? null : _submitReturn,
            isLoading: _isSubmitting,
            width: double.infinity,
          ),
        ),
      ],
    );
  }

  Widget _buildReasonOption(ReturnReason reason) {
    final isSelected = _selectedReason == reason;
    
    return GestureDetector(
      onTap: () => setState(() => _selectedReason = reason),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 15),
        child: Row(
          children: [
            Icon(
              isSelected
                  ? PhosphorIcons.checkCircle(PhosphorIconsStyle.fill)
                  : PhosphorIcons.circle(),
              size: 18,
              color: AppColors.textPrimary,
            ),
            const SizedBox(width: 12),
            Text(
              reason.label,
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
