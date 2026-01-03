import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/app_text_field.dart';
import 'package:dres/core/services/site_settings_service.dart';
import 'package:dres/features/sell/logic/variation_detail_bloc/variation_detail_bloc.dart';
import 'package:dres/features/sell/logic/variations_bloc/variations_bloc.dart';
import 'package:dres/features/sell/logic/sell_bloc/sell_bloc.dart';
import 'package:dres/features/sell/data/models/attribute_model.dart';
import 'package:dres/features/sell/data/models/variation_model.dart';

class SkuDetailScreen extends StatefulWidget {
  final String styleId;
  final String variationId;
  final String skuId;
  final String? variationName;
  final String? categoryId;

  const SkuDetailScreen({
    super.key,
    required this.styleId,
    required this.variationId,
    required this.skuId,
    this.variationName,
    this.categoryId,
  });

  @override
  State<SkuDetailScreen> createState() => _SkuDetailScreenState();
}

class _SkuDetailScreenState extends State<SkuDetailScreen> {
  late final VariationDetailBloc _variationDetailBloc;
  late final SiteSettingsService _siteSettingsService;

  final _priceController = TextEditingController();
  final _comparePriceController = TextEditingController();
  final _stockController = TextEditingController();

  // Selected attribute and option (IDs and names)
  String? _selectedAttributeId;
  String? _selectedOptionId;
  String? _selectedOptionName;

  double _sellingPrice = 0.0;
  bool _dataPopulated = false;
  bool _isExpanded = true;

  double get _commissionRate => _siteSettingsService.commissionRate;
  double get _commissionDecimal => _siteSettingsService.commissionDecimal;

  @override
  void initState() {
    super.initState();
    _variationDetailBloc = getIt<VariationDetailBloc>();
    _siteSettingsService = getIt<SiteSettingsService>();
    _variationDetailBloc.add(
      VariationDetailLoadRequested(
        variationId: widget.variationId,
        categoryId: widget.categoryId,
      ),
    );

    _priceController.addListener(_updateSellingPrice);
  }

  @override
  void dispose() {
    _priceController.removeListener(_updateSellingPrice);
    _priceController.dispose();
    _comparePriceController.dispose();
    _stockController.dispose();
    super.dispose();
  }

  void _updateSellingPrice() {
    final price = double.tryParse(_priceController.text) ?? 0;
    setState(() {
      _sellingPrice = price * (1 + _commissionDecimal);
    });
  }

  void _populateFromSku(SkuModel sku, AttributeModel? skuAttribute) {
    if (!_dataPopulated) {
      _dataPopulated = true;
      setState(() {
        // Get attribute and option from skuOptions
        _selectedAttributeId = sku.attributeId ?? skuAttribute?.id;
        _selectedOptionId = sku.attributeOptionId;
        _selectedOptionName = sku.size; // size getter returns optionName

        if (sku.price > 0) {
          _priceController.text = sku.price.toStringAsFixed(2);
        }
        if (sku.compareAtPrice != null) {
          _comparePriceController.text = sku.compareAtPrice!.toStringAsFixed(2);
        }
        if (sku.stock > 0) {
          _stockController.text = sku.stock.toString();
        }
      });
      _updateSellingPrice();
    }
  }

  void _onDone() {
    if (_selectedAttributeId == null || _selectedOptionId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a value')),
      );
      return;
    }

    final price = double.tryParse(_priceController.text);
    if (price == null || price <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid price')),
      );
      return;
    }

    final comparePrice = double.tryParse(_comparePriceController.text);
    if (comparePrice != null && comparePrice <= _sellingPrice) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Compare price should be more than selling price'),
        ),
      );
      return;
    }

    final stock = int.tryParse(_stockController.text);

    _variationDetailBloc.add(
      SkuUpdateRequested(
        skuId: widget.skuId,
        attributeId: _selectedAttributeId!,
        attributeOptionId: _selectedOptionId!,
        price: price,
        compareAtPrice: comparePrice,
        stock: stock,
      ),
    );
  }

  void _showValuePicker(AttributeModel attribute) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Text(
                      'Select ${attribute.name}',
                      style: AppTypography.bodyL.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: PhosphorIcon(
                        PhosphorIcons.x(),
                        color: AppColors.textPrimary,
                        size: 20,
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: AppColors.secondary),
              // Options
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: attribute.options.length,
                  itemBuilder: (context, index) {
                    final option = attribute.options[index];
                    final isSelected = _selectedOptionId == option.id;
                    return ListTile(
                      title: Text(
                        option.name,
                        style: AppTypography.bodyL.copyWith(
                          fontWeight:
                              isSelected ? FontWeight.w700 : FontWeight.w400,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      trailing: isSelected
                          ? PhosphorIcon(
                              PhosphorIcons.check(),
                              color: AppColors.textPrimary,
                              size: 20,
                            )
                          : null,
                      onTap: () {
                        setState(() {
                          _selectedAttributeId = attribute.id;
                          _selectedOptionId = option.id;
                          _selectedOptionName = option.name;
                        });
                        Navigator.pop(context);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _variationDetailBloc,
      child: BlocConsumer<VariationDetailBloc, VariationDetailState>(
        listener: (context, state) {
          if (state.status == VariationDetailStatus.loaded) {
            final sku =
                state.skus.where((s) => s.id == widget.skuId).firstOrNull;
            final skuAttribute =
                state.skuAttributes.isNotEmpty ? state.skuAttributes.first : null;
            if (sku != null) {
              _populateFromSku(sku, skuAttribute);
            }
          }

          if (state.status == VariationDetailStatus.skuUpdateSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('SKU updated successfully')),
            );
            getIt<VariationsBloc>().add(const VariationsRefreshRequested());
            getIt<SellBloc>().add(const SellRefreshRequested());
            context.pop();
          }

          if (state.status == VariationDetailStatus.failure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage ?? 'An error occurred'),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        builder: (context, state) {
          final isLoading = state.status == VariationDetailStatus.loading;
          final isUpdating = state.status == VariationDetailStatus.skuUpdating;

          // Get SKU-level attributes from the category
          final skuAttributes = state.skuAttributes;
          final skuAttribute =
              skuAttributes.isNotEmpty ? skuAttributes.first : null;
          final attributeName = skuAttribute?.name ?? 'Size';

          return Scaffold(
            backgroundColor: AppColors.background,
            body: SafeArea(
              child: Column(
                children: [
                  UnifiedHeader.titleOnly(
                    title: widget.variationName ?? 'SKU Details',
                  ),
                  Expanded(
                    child: isLoading
                        ? const Center(
                            child: CircularProgressIndicator(
                              color: AppColors.textPrimary,
                            ),
                          )
                        : SingleChildScrollView(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // SKU Attribute Card
                                _buildAttributeCard(
                                  attributeName: attributeName,
                                  skuAttribute: skuAttribute,
                                ),

                                const SizedBox(height: 20),

                                // Price
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                  ),
                                  child: AppTextField(
                                    controller: _priceController,
                                    label: 'Price',
                                    hintText: '₵ 200.00',
                                    keyboardType: TextInputType.number,
                                  ),
                                ),

                                const SizedBox(height: 20),

                                // Selling price (read-only)
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Selling price (price + commission)',
                                        style: AppTypography.bodyM.copyWith(
                                          color: AppColors.textPrimary,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Container(
                                        width: double.infinity,
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 16,
                                          vertical: 16,
                                        ),
                                        decoration: BoxDecoration(
                                          color: AppColors.secondary,
                                          border: Border.all(
                                            color: AppColors.border,
                                          ),
                                        ),
                                        child: Text(
                                          '₵ ${_sellingPrice.toStringAsFixed(2)}',
                                          style: AppTypography.bodyM.copyWith(
                                            color: AppColors.textSecondary,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        '${_commissionRate.toStringAsFixed(0)}% of price + price (customer pays this and you get your original price)',
                                        style: AppTypography.bodyS.copyWith(
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                const SizedBox(height: 20),

                                // Compare price at (optional)
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      RichText(
                                        text: TextSpan(
                                          style: AppTypography.bodyM.copyWith(
                                            color: AppColors.textPrimary,
                                            fontWeight: FontWeight.w500,
                                          ),
                                          children: [
                                            const TextSpan(
                                              text: 'Compare price at ',
                                            ),
                                            TextSpan(
                                              text: '(optional)',
                                              style:
                                                  AppTypography.bodyM.copyWith(
                                                color: AppColors.textHint,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      AppTextField(
                                        controller: _comparePriceController,
                                        hintText: '₵ 300.00',
                                        keyboardType: TextInputType.number,
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        'Should be more than selling price',
                                        style: AppTypography.bodyS.copyWith(
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                const SizedBox(height: 20),

                                // Stock (optional)
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      RichText(
                                        text: TextSpan(
                                          style: AppTypography.bodyM.copyWith(
                                            color: AppColors.textPrimary,
                                            fontWeight: FontWeight.w500,
                                          ),
                                          children: [
                                            const TextSpan(text: 'Stock '),
                                            TextSpan(
                                              text: '(optional)',
                                              style:
                                                  AppTypography.bodyM.copyWith(
                                                color: AppColors.textHint,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      AppTextField(
                                        controller: _stockController,
                                        hintText: '10',
                                        keyboardType: TextInputType.number,
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        "Leave blank if you don't want to keep track of stock",
                                        style: AppTypography.bodyS.copyWith(
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                const SizedBox(height: 20),
                              ],
                            ),
                          ),
                  ),

                  // Bottom button
                  Container(
                    color: AppColors.background,
                    child: SafeArea(
                      top: false,
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: SizedBox(
                          width: double.infinity,
                          child: AppButton(
                            text: 'Done',
                            isLoading: isUpdating,
                            onPressed: isUpdating ? null : _onDone,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  /// Build SKU attribute card
  Widget _buildAttributeCard({
    required String attributeName,
    AttributeModel? skuAttribute,
  }) {
    final displayString = _selectedOptionName != null
        ? '$attributeName: $_selectedOptionName'
        : attributeName;

    return Container(
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.secondary, width: 10),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.background,
            border: Border.all(color: AppColors.secondary),
          ),
          child: Column(
            children: [
              // Header - shows selected attribute summary
              GestureDetector(
                onTap: () => setState(() => _isExpanded = !_isExpanded),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: AppColors.secondary,
                    border: Border(
                      bottom: BorderSide(color: AppColors.secondary, width: 1),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          displayString,
                          style: AppTypography.bodyL.copyWith(
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      PhosphorIcon(
                        _isExpanded
                            ? PhosphorIcons.caretUp()
                            : PhosphorIcons.caretDown(),
                        color: AppColors.textPrimary,
                        size: 14,
                      ),
                    ],
                  ),
                ),
              ),

              // Expanded content - attribute selector
              if (_isExpanded) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(9, 11, 9, 13),
                  child: Column(
                    children: [
                      // Attribute type (fixed based on category)
                      _DropdownField(
                        label: attributeName,
                        enabled: false,
                        onTap: null,
                      ),
                      const SizedBox(height: 10),
                      // Attribute value selector
                      _DropdownField(
                        label: _selectedOptionName ?? 'Select value',
                        enabled: skuAttribute != null,
                        onTap: skuAttribute != null
                            ? () => _showValuePicker(skuAttribute)
                            : null,
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Dropdown field widget
class _DropdownField extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final bool enabled;

  const _DropdownField({
    required this.label,
    this.onTap,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          border: Border.all(
            color: enabled ? AppColors.textPrimary : AppColors.textHint,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: AppTypography.bodyL.copyWith(
                  color: enabled ? AppColors.textPrimary : AppColors.textHint,
                ),
              ),
            ),
            PhosphorIcon(
              PhosphorIcons.caretDown(),
              color: enabled ? AppColors.textPrimary : AppColors.textHint,
              size: 14,
            ),
          ],
        ),
      ),
    );
  }
}
