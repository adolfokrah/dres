import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/features/sell/logic/variation_detail_bloc/variation_detail_bloc.dart';
import 'package:dres/features/sell/logic/variations_bloc/variations_bloc.dart';
import 'package:dres/features/sell/logic/sell_bloc/sell_bloc.dart';
import 'package:dres/features/sell/presentation/widgets/item_photos_section.dart';
import 'package:dres/features/sell/presentation/widgets/attributes_section.dart';

class VariationDetailScreen extends StatefulWidget {
  final String styleId;
  final String variationId;
  final String? variationName;
  final String? categoryId;

  const VariationDetailScreen({
    super.key,
    required this.styleId,
    required this.variationId,
    this.variationName,
    this.categoryId,
  });

  @override
  State<VariationDetailScreen> createState() => _VariationDetailScreenState();
}

class _VariationDetailScreenState extends State<VariationDetailScreen> {
  late final VariationDetailBloc _variationDetailBloc;

  // Selected images (local files)
  List<File> _selectedImages = [];

  // Selected attributes
  List<SelectedAttribute> _selectedAttributes = [];

  // Track if we're waiting to navigate after SKU creation
  bool _waitingForSkuCreation = false;

  // Track if we're waiting for variation update to complete
  bool _waitingForUpdate = false;

  // Track if attributes have been populated from loaded data
  bool _attributesPopulated = false;

  /// Check if the variation form is valid (can be saved)
  /// Requires: 3+ images, 1+ attribute selected, 1+ SKU
  bool _isFormValid(List<String> existingImages, List<dynamic> skus) {
    final totalImages = existingImages.length + _selectedImages.length;
    final hasEnoughImages = totalImages >= 3;
    final hasAttribute = _selectedAttributes.any((a) => a.isComplete);
    final hasSku = skus.isNotEmpty;

    return hasEnoughImages && hasAttribute && hasSku;
  }

  @override
  void initState() {
    super.initState();
    _variationDetailBloc = getIt<VariationDetailBloc>();
    _variationDetailBloc.add(
      VariationDetailLoadRequested(
        variationId: widget.variationId,
        categoryId: widget.categoryId,
      ),
    );
  }

  void _onAddAttribute() {
    setState(() {
      _selectedAttributes.add(
        const SelectedAttribute(attributeId: '', attributeName: ''),
      );
    });
  }

  void _onAddSku() {
    // Get SKU attribute from state (e.g., Size)
    final skuAttributes = _variationDetailBloc.state.skuAttributes;
    if (skuAttributes.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No SKU attributes available')),
      );
      return;
    }

    final skuAttribute = skuAttributes.first;
    if (skuAttribute.options.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No options available for SKU attribute')),
      );
      return;
    }

    // Use first option as default (e.g., first size option)
    final firstOption = skuAttribute.options.first;

    // Create an empty SKU and navigate to detail page
    _waitingForSkuCreation = true;
    _variationDetailBloc.add(
      SkuCreateRequested(
        variationId: widget.variationId,
        attributeId: skuAttribute.id,
        attributeOptionId: firstOption.id,
        price: 0, // Will be set in detail page
        stock: 1,
      ),
    );
  }

  void _onSkuTap(dynamic sku) {
    // Navigate to SKU detail page
    context.push(
      '/sell/style/${widget.styleId}/variation/${widget.variationId}/sku/${sku.id}',
      extra: {
        'variationName': widget.variationName,
        'categoryId': widget.categoryId,
      },
    );
  }

  void _onDone() {
    // Build variants list from selected attributes that are complete
    final variants = _selectedAttributes
        .where((a) => a.isComplete)
        .map(
          (a) => VariantOption(attributeId: a.attributeId, valueId: a.valueId!),
        )
        .toList();

    // Get existing image IDs from the loaded variation
    final existingImageIds =
        _variationDetailBloc.state.variation?.imageIds ?? [];

    // Always update - even if no attributes, we need to save images
    _waitingForUpdate = true;
    _variationDetailBloc.add(
      VariationUpdateRequested(
        variationId: widget.variationId,
        variants: variants,
        existingImageIds: existingImageIds,
        newImages: _selectedImages,
      ),
    );
  }

  void _navigateBack() {
    // Refresh variations list
    getIt<VariationsBloc>().add(const VariationsRefreshRequested());
    // Refresh drafts
    getIt<SellBloc>().add(const SellRefreshRequested());

    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _variationDetailBloc,
      child: BlocConsumer<VariationDetailBloc, VariationDetailState>(
        listener: (context, state) {
          if (state.status == VariationDetailStatus.loaded &&
              state.variation != null &&
              !_attributesPopulated) {
            // Populate selected attributes from loaded variation's variants (only once)
            _attributesPopulated = true;

            // Log loaded data for debugging

            final loadedAttributes = state.variation!.variants
                .map(
                  (v) => SelectedAttribute(
                    attributeId: v.attributeId,
                    attributeName: v.attributeName,
                    valueId: v.valueId,
                    valueName: v.valueName,
                  ),
                )
                .toList();

            if (loadedAttributes.isNotEmpty) {
              setState(() {
                _selectedAttributes = loadedAttributes;
              });
            }
          }

          // When SKU is created, navigate to detail page
          if (state.status == VariationDetailStatus.skuCreateSuccess &&
              _waitingForSkuCreation) {
            _waitingForSkuCreation = false;
            // Get the newly created SKU (last in list)
            if (state.skus.isNotEmpty) {
              final newSku = state.skus.last;
              context.push(
                '/sell/style/${widget.styleId}/variation/${widget.variationId}/sku/${newSku.id}',
                extra: {
                  'variationName': widget.variationName,
                  'categoryId': widget.categoryId,
                },
              );
            }
          }

          if (state.status == VariationDetailStatus.failure) {
            _waitingForSkuCreation = false;
            _waitingForUpdate = false;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage ?? 'An error occurred'),
                backgroundColor: Colors.red,
              ),
            );
          }

          // When variation update succeeds, navigate back
          if (state.status == VariationDetailStatus.updateSuccess &&
              _waitingForUpdate) {
            _waitingForUpdate = false;
            _navigateBack();
          }
        },
        builder: (context, state) {
          final isLoading = state.status == VariationDetailStatus.loading;
          final isCreatingSku =
              state.status == VariationDetailStatus.skuCreating;
          final isUpdating = state.status == VariationDetailStatus.updating;
          final variation = state.variation;
          final skus = state.skus;

          return Scaffold(
            backgroundColor: AppColors.background,
            body: SafeArea(
              child: Column(
                children: [
                  // Header
                  UnifiedHeader.titleOnly(
                    title:
                        widget.variationName ??
                        variation?.displayName ??
                        'Variation',
                  ),

                  // Content
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
                                // Photos section
                                ItemPhotosSection(
                                  existingImages: variation?.images ?? [],
                                  selectedImages: _selectedImages,
                                  onImagesChanged: (images) {
                                    setState(() {
                                      _selectedImages = images;
                                    });
                                  },
                                ),

                                // Attributes section
                                AttributesSection(
                                  availableAttributes:
                                      state.variationAttributes,
                                  selectedAttributes: _selectedAttributes,
                                  onAttributesChanged: (attributes) {
                                    setState(() {
                                      _selectedAttributes = attributes;
                                    });
                                  },
                                  onAddAttribute:
                                      state.variationAttributes.isNotEmpty
                                      ? _onAddAttribute
                                      : null,
                                ),

                                // SKUs section
                                _buildSkusSection(skus, isCreatingSku),
                              ],
                            ),
                          ),
                  ),

                  // Bottom button
                  _buildBottomSection(
                    existingImages: variation?.images ?? [],
                    skus: skus,
                    isUpdating: isUpdating,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSkusSection(List<dynamic> skus, bool isCreating) {
    return Column(
      children: [
        // Header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          decoration: const BoxDecoration(
            border: Border(
              bottom: BorderSide(color: AppColors.secondary, width: 1),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'SKUs',
                style: AppTypography.bodyL.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              GestureDetector(
                onTap: isCreating ? null : _onAddSku,
                child: isCreating
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.textPrimary,
                        ),
                      )
                    : PhosphorIcon(
                        PhosphorIcons.plus(),
                        color: AppColors.textPrimary,
                        size: 20,
                      ),
              ),
            ],
          ),
        ),

        // SKUs list
        if (skus.isEmpty)
          Padding(
            padding: const EdgeInsets.all(40),
            child: Center(
              child: Column(
                children: [
                  PhosphorIcon(
                    PhosphorIcons.package(),
                    size: 48,
                    color: AppColors.textHint,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No SKUs yet',
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textHint,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tap + to add size and price',
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.textHint,
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          ...skus.map((sku) => _buildSkuItem(sku)),
      ],
    );
  }

  Widget _buildSkuItem(dynamic sku) {
    final size = sku.size ?? 'No size';
    final price = sku.price?.toStringAsFixed(0) ?? '0';

    return GestureDetector(
      onTap: () => _onSkuTap(sku),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(color: AppColors.secondary, width: 1),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                size,
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            Text(
              '₵ $price',
              style: AppTypography.bodyM.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(width: 20),
            PhosphorIcon(
              PhosphorIcons.caretRight(),
              color: AppColors.textPrimary,
              size: 14,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomSection({
    required List<String> existingImages,
    required List<dynamic> skus,
    required bool isUpdating,
  }) {
    final isValid = _isFormValid(existingImages, skus);

    return Container(
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
              onPressed: isValid && !isUpdating ? _onDone : null,
            ),
          ),
        ),
      ),
    );
  }
}
