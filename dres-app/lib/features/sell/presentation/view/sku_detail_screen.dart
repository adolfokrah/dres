import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/app_text_field.dart';
import 'package:dres/core/widgets/app_info_banner.dart';
import 'package:dres/core/services/site_settings_service.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/features/sell/logic/variation_detail_bloc/variation_detail_bloc.dart';
import 'package:dres/features/sell/logic/variations_bloc/variations_bloc.dart';
import 'package:dres/features/sell/logic/sell_bloc/sell_bloc.dart';
import 'package:dres/features/sell/data/models/variation_model.dart';
import 'package:dres/features/sell/presentation/widgets/attributes_section.dart';

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
  String? _selectedAttributeName;
  String? _selectedOptionId;
  String? _selectedOptionName;

  double _sellingPrice = 0.0;
  // Track which SKU we populated data from to prevent re-population of same SKU
  // but allow population when switching to different SKU
  String? _populatedSkuId;
  bool _isUpdating = false;
  bool _isArchiving = false;

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
  void didUpdateWidget(covariant SkuDetailScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Reset state when skuId changes (navigating to a different SKU)
    if (oldWidget.skuId != widget.skuId) {
      _resetState();
      _variationDetailBloc.add(
        VariationDetailLoadRequested(
          variationId: widget.variationId,
          categoryId: widget.categoryId,
        ),
      );
    }
  }

  void _resetState() {
    setState(() {
      _populatedSkuId = null;
      _selectedAttributeId = null;
      _selectedAttributeName = null;
      _selectedOptionId = null;
      _selectedOptionName = null;
      _sellingPrice = 0.0;
      _isUpdating = false;
      _isArchiving = false;
    });
    _priceController.clear();
    _comparePriceController.clear();
    _stockController.clear();
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
    // Only populate if this is the SKU we're editing and we haven't populated it yet
    if (_populatedSkuId != sku.id) {
      _populatedSkuId = sku.id;
      setState(() {
        // For SKU editing, we should have exactly one SKU option
        // If there are multiple, we need to pick the right one based on available attributes
        SkuOptionModel? selectedOption;
        
        if (sku.skuOptions.isNotEmpty) {
          final state = _variationDetailBloc.state;
          if (state.skuAttributes.isNotEmpty) {
            // Try to find a SKU option that matches one of the available attributes
            selectedOption = sku.skuOptions.firstWhere(
              (option) => state.skuAttributes.any((attr) => attr.id == option.attributeId),
              orElse: () => sku.skuOptions.first,
            );
          } else {
            selectedOption = sku.skuOptions.first;
          }
        }
        
        if (selectedOption != null) {
          _selectedAttributeId = selectedOption.attributeId;
          _selectedOptionId = selectedOption.optionId;
          _selectedOptionName = selectedOption.optionName;
          _selectedAttributeName = selectedOption.attributeName;
        } else {
          // Fallback if no options
          _selectedAttributeId = skuAttribute?.id;
          _selectedAttributeName = skuAttribute?.name;
          _selectedOptionId = null;
          _selectedOptionName = null;
        }

        if (sku.price > 0) {
          _priceController.text = sku.price.toStringAsFixed(2);
        } else {
          _priceController.clear();
        }
        if (sku.compareAtPrice != null && sku.compareAtPrice! > 0) {
          _comparePriceController.text = sku.compareAtPrice!.toStringAsFixed(2);
        } else {
          _comparePriceController.clear();
        }
        if (sku.stock > 0) {
          _stockController.text = sku.stock.toString();
        } else {
          _stockController.clear();
        }
      });
      _updateSellingPrice();
    }
  }

  void _onDone() {
    if (_selectedAttributeId == null || _selectedOptionId == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(
        content: Text('Please select a value'),
        backgroundColor: AppColors.error,
      ));
      return;
    }

    final price = double.tryParse(_priceController.text);
    if (price == null || price <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid price'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final comparePrice = double.tryParse(_comparePriceController.text);
    if (comparePrice != null && comparePrice <= _sellingPrice) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Compare price should be more than selling price'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final stock = int.tryParse(_stockController.text);

    _isUpdating = true;
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

  void _onRemove() {
    // Show confirmation dialog
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
        backgroundColor: AppColors.surface,
        title: Text(
          'Remove SKU',
          style: AppTypography.titleLM.copyWith(color: AppColors.textPrimary),
        ),
        content: Text(
          'Are you sure you want to remove this SKU? It will be archived and can be restored later.',
          style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(
              'Cancel',
              style: AppTypography.bodyM.copyWith(color: AppColors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              _isArchiving = true;
              _variationDetailBloc.add(
                SkuArchiveRequested(skuId: widget.skuId),
              );
            },
            child: Text(
              'Remove',
              style: AppTypography.bodyM.copyWith(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _variationDetailBloc,
      child: BlocConsumer<VariationDetailBloc, VariationDetailState>(
        listener: (context, state) {
          if (state.status == VariationDetailStatus.loaded) {
            final sku = state.skus
                .where((s) => s.id == widget.skuId)
                .firstOrNull;
            final skuAttribute = state.skuAttributes.isNotEmpty
                ? state.skuAttributes.first
                : null;
            if (sku != null) {
              _populateFromSku(sku, skuAttribute);
            }
          }

          // Only handle success states if this screen initiated the action
          if (state.status == VariationDetailStatus.skuUpdateSuccess && _isUpdating) {
            _isUpdating = false;
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('SKU updated successfully'),
                backgroundColor: AppColors.success,
              ),
            );
            // Refresh variation detail to show updated SKU data
            _variationDetailBloc.add(
              VariationDetailLoadRequested(
                variationId: widget.variationId,
                categoryId: widget.categoryId,
              ),
            );
            getIt<VariationsBloc>().add(const VariationsRefreshRequested());
            getIt<SellBloc>().add(const SellRefreshRequested());
            context.pop();
          }

          if (state.status == VariationDetailStatus.skuArchiveSuccess && _isArchiving) {
            _isArchiving = false;
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('SKU removed'),
                backgroundColor: AppColors.success,
              ),
            );
            getIt<VariationsBloc>().add(const VariationsRefreshRequested());
            getIt<SellBloc>().add(const SellRefreshRequested());
            context.pop();
          }

          if (state.status == VariationDetailStatus.failure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage ?? 'An error occurred'),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        builder: (context, state) {
          final isLoading = state.status == VariationDetailStatus.loading;
          final isUpdating = state.status == VariationDetailStatus.skuUpdating;
          final isArchiving =
              state.status == VariationDetailStatus.skuArchiving;

          // Get SKU-level attributes from the category
          final skuAttributes = state.skuAttributes;
          final skuAttribute = skuAttributes.isNotEmpty
              ? skuAttributes.first
              : null;

          return Scaffold(
            backgroundColor: AppColors.background,
            body: SafeArea(
              child: Column(
                children: [
                  UnifiedHeader.titleOnly(
                    title: widget.variationName ?? 'SKU Details',
                    rightWidget: GestureDetector(
                      onTap: isArchiving ? null : _onRemove,
                      child: isArchiving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.textPrimary,
                              ),
                            )
                          : Text(
                              'Remove',
                              style: AppTypography.bodyM.copyWith(
                                fontWeight: FontWeight.w600,
                                color: AppColors.error,
                              ),
                            ),
                    ),
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
                                // Info banner for incomplete SKU
                                Builder(
                                  builder: (context) {
                                    final sku = state.skus.where((s) => s.id == widget.skuId).firstOrNull;
                                    final hasPrice = sku != null && sku.price > 0;
                                    final hasAttribute = _selectedAttributeId != null && _selectedOptionId != null;
                                    final isIncomplete = !hasPrice || !hasAttribute;
                                    
                                    if (isIncomplete) {
                                      return const Padding(
                                        padding: EdgeInsets.all(20),
                                        child: AppInfoBanner.info(
                                          text: 'This SKU needs a size/attribute and price to be active. Incomplete SKUs won\'t be visible to buyers even when the product is published.',
                                        ),
                                      );
                                    }
                                    return const SizedBox.shrink();
                                  },
                                ),

                                // SKU Attribute Card
                                SkuAttributeCard(
                                  availableAttributes: skuAttributes,
                                  selectedAttributeId: _selectedAttributeId,
                                  selectedAttributeName: _selectedAttributeName,
                                  selectedOptionId: _selectedOptionId,
                                  selectedOptionName: _selectedOptionName,
                                  onAttributeSelected: (id, name) {
                                    setState(() {
                                      _selectedAttributeId = id;
                                      _selectedAttributeName = name;
                                      // Clear option when attribute changes
                                      _selectedOptionId = null;
                                      _selectedOptionName = null;
                                    });
                                  },
                                  onOptionSelected: (id, name) {
                                    setState(() {
                                      _selectedOptionId = id;
                                      _selectedOptionName = name;
                                    });
                                  },
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
                                    hintText: '${CurrencyUtils.currentSymbol} 200.00',
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
                                          '${CurrencyUtils.currentSymbol} ${_sellingPrice.toStringAsFixed(2)}',
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
                                              style: AppTypography.bodyM
                                                  .copyWith(
                                                    color: AppColors.textHint,
                                                  ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      AppTextField(
                                        controller: _comparePriceController,
                                        hintText: '${CurrencyUtils.currentSymbol} 300.00',
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
                                              style: AppTypography.bodyM
                                                  .copyWith(
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
}
