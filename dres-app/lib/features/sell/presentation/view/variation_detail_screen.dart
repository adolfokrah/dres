import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_overlay_loader/flutter_overlay_loader.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/app_snackbar.dart';
import 'package:dres/core/widgets/app_info_banner.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/features/sell/logic/variation_detail_bloc/variation_detail_bloc.dart';
import 'package:dres/features/sell/logic/variations_bloc/variations_bloc.dart';
import 'package:dres/features/sell/logic/sell_bloc/sell_bloc.dart';
import 'package:dres/features/sell/presentation/widgets/item_photos_section.dart';
import 'package:dres/features/sell/presentation/widgets/attributes_section.dart';
import 'package:dres/features/sell/presentation/widgets/color_section.dart';
import 'package:dres/features/profile/logic/user_products_bloc/user_products_bloc.dart';

/// Local SKU model for storing unsaved/edited SKUs
class LocalSku {
  final String localId; // Temporary ID for local tracking
  final String? skuId; // Existing SKU ID if editing, null if new
  final String attributeId;
  final String attributeOptionId;
  final String optionName; // Display name (e.g., "S", "M", "L")
  final double price;
  final double? compareAtPrice;
  final int? stock; // null = unlimited
  final bool flashSaleEnabled;
  final DateTime? flashSaleEndDate;

  LocalSku({
    required this.localId,
    this.skuId,
    required this.attributeId,
    required this.attributeOptionId,
    required this.optionName,
    this.price = 0,
    this.compareAtPrice,
    this.stock,
    this.flashSaleEnabled = false,
    this.flashSaleEndDate,
  });

  LocalSku copyWith({
    double? price,
    double? compareAtPrice,
    int? stock,
    bool? flashSaleEnabled,
    DateTime? flashSaleEndDate,
  }) {
    return LocalSku(
      localId: localId,
      skuId: skuId,
      attributeId: attributeId,
      attributeOptionId: attributeOptionId,
      optionName: optionName,
      price: price ?? this.price,
      compareAtPrice: compareAtPrice ?? this.compareAtPrice,
      stock: stock ?? this.stock,
      flashSaleEnabled: flashSaleEnabled ?? this.flashSaleEnabled,
      flashSaleEndDate: flashSaleEndDate ?? this.flashSaleEndDate,
    );
  }

  /// Check if this is an existing SKU being edited
  bool get isExisting => skuId != null;
}

class VariationDetailScreen extends StatefulWidget {
  final String styleId;
  final String variationId;
  final String? variationName;
  final String? categoryId;
  final String? authenticity;

  const VariationDetailScreen({
    super.key,
    required this.styleId,
    required this.variationId,
    this.variationName,
    this.categoryId,
    this.authenticity,
  });

  @override
  State<VariationDetailScreen> createState() => _VariationDetailScreenState();
}

class _VariationDetailScreenState extends State<VariationDetailScreen> {
  late final VariationDetailBloc _variationDetailBloc;

  // Selected images (local files)
  List<File> _selectedImages = [];

  // Selected color (required, separate from other attributes)
  String? _selectedColorId;
  String? _selectedColorName;

  // Selected attributes (excluding color)
  List<SelectedAttribute> _selectedAttributes = [];

  // Local SKUs (not yet saved to backend)
  List<LocalSku> _localSkus = [];

  // Track if we're waiting for variation update to complete (full save with navigation)
  bool _waitingForUpdate = false;

  // Track if we're just saving images in background (no navigation)
  bool _savingImagesOnly = false;

  // Track if attributes have been populated from loaded data
  bool _attributesPopulated = false;

  // Track if we're waiting for image reorder to complete
  bool _waitingForImageReorder = false;

  // Store reordered images locally until variation updates
  List<String>? _reorderedImages;
  
  // Store ObjectIds separately for server requests
  List<String>? _reorderedImageIds;

  /// Check if the variation form is valid (can be saved)
  /// Requires: color selected, 3+ images, at least 1 SKU with price
  bool _isFormValid(List<String> existingImages) {
    final totalImages = existingImages.length + _selectedImages.length;
    final hasEnoughImages = totalImages >= 3;
    final hasColor = _selectedColorId != null && _selectedColorId!.isNotEmpty;

    // Check if we have at least one SKU (local or saved) with price > 0
    final savedSkus = _variationDetailBloc.state.skus;
    final hasSkuWithPrice = _localSkus.any((s) => s.price > 0) ||
                           savedSkus.any((s) => s.price > 0);

    return hasEnoughImages && hasColor && hasSkuWithPrice;
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

  @override
  void dispose() {
    Loader.hide();
    super.dispose();
  }

  void _onAddAttribute() {
    setState(() {
      _selectedAttributes.add(
        const SelectedAttribute(attributeId: '', attributeName: ''),
      );
    });
  }

  void _onAddSku() async {
    // Get SKU attribute from state (e.g., Size)
    final skuAttributes = _variationDetailBloc.state.skuAttributes;
    if (skuAttributes.isEmpty) {
      AppSnackbar.error(context, 'No SKU attributes available');
      return;
    }

    final skuAttribute = skuAttributes.first;
    if (skuAttribute.options.isEmpty) {
      AppSnackbar.error(context, 'No options available for SKU attribute');
      return;
    }

    // Get existing SKU option IDs (both saved and local)
    final savedSkus = _variationDetailBloc.state.skus;
    final usedOptionIds = <String>{
      ...savedSkus.map((sku) => sku.attributeOptionId).whereType<String>(),
      ..._localSkus.map((sku) => sku.attributeOptionId),
    };

    // Navigate to SKU detail screen in "new" mode
    final result = await context.push<Map<String, dynamic>>(
      '/sku-detail/${widget.styleId}/${widget.variationId}/new',
      extra: {
        'variationName': widget.variationName,
        'categoryId': widget.categoryId,
        'isNewSku': true,
        'usedOptionIds': usedOptionIds.toList(),
      },
    );

    // Handle result from SKU detail screen
    if (result != null) {
      final localSku = LocalSku(
        localId: 'local_${DateTime.now().millisecondsSinceEpoch}',
        attributeId: result['attributeId'] as String,
        attributeOptionId: result['attributeOptionId'] as String,
        optionName: result['optionName'] as String,
        price: result['price'] as double,
        stock: result['stock'] as int?,
        flashSaleEnabled: result['flashSaleEnabled'] as bool? ?? false,
        flashSaleEndDate: result['flashSaleEndDate'] != null
            ? DateTime.tryParse(result['flashSaleEndDate'] as String)
            : null,
      );

      setState(() {
        _localSkus.add(localSku);
      });
    }
  }

  void _onLocalSkuTap(LocalSku sku) async {
    // Navigate to SKU detail screen to edit local SKU
    final result = await context.push<Map<String, dynamic>>(
      '/sku-detail/${widget.styleId}/${widget.variationId}/local_${sku.localId}',
      extra: {
        'variationName': widget.variationName,
        'categoryId': widget.categoryId,
        'isNewSku': true,
        'editingLocalSku': {
          'attributeId': sku.attributeId,
          'attributeOptionId': sku.attributeOptionId,
          'optionName': sku.optionName,
          'price': sku.price,
          'stock': sku.stock,
          'flashSaleEnabled': sku.flashSaleEnabled,
          'flashSaleEndDate': sku.flashSaleEndDate?.toIso8601String(),
        },
        'usedOptionIds': _localSkus
            .where((s) => s.localId != sku.localId)
            .map((s) => s.attributeOptionId)
            .toList(),
      },
    );

    // Handle result - update or delete
    if (result != null) {
      if (result['deleted'] == true) {
        setState(() {
          _localSkus.removeWhere((s) => s.localId == sku.localId);
        });
      } else {
        setState(() {
          final index = _localSkus.indexWhere((s) => s.localId == sku.localId);
          if (index != -1) {
            _localSkus[index] = LocalSku(
              localId: sku.localId,
              attributeId: result['attributeId'] as String,
              attributeOptionId: result['attributeOptionId'] as String,
              optionName: result['optionName'] as String,
              price: result['price'] as double,
              stock: result['stock'] as int?,
              flashSaleEnabled: result['flashSaleEnabled'] as bool? ?? false,
              flashSaleEndDate: result['flashSaleEndDate'] != null
                  ? DateTime.tryParse(result['flashSaleEndDate'] as String)
                  : null,
            );
          }
        });
      }
    }
  }

  void _onRemoveLocalSku(LocalSku sku) {
    setState(() {
      _localSkus.removeWhere((s) => s.localId == sku.localId);
    });
  }

  void _onSkuTap(dynamic sku) async {
    // Navigate to SKU detail page to edit existing SKU
    final result = await context.push<Map<String, dynamic>>(
      '/sku-detail/${widget.styleId}/${widget.variationId}/${sku.id}',
      extra: {
        'variationName': widget.variationName,
        'categoryId': widget.categoryId,
        'isNewSku': false, // This is an existing SKU
      },
    );

    // Handle result - add edited SKU to local state
    if (result != null) {
      final editedSku = LocalSku(
        localId: 'edited_${sku.id}_${DateTime.now().millisecondsSinceEpoch}',
        skuId: result['skuId'] as String?, // Include the existing SKU ID
        attributeId: result['attributeId'] as String,
        attributeOptionId: result['attributeOptionId'] as String,
        optionName: result['optionName'] as String,
        price: result['price'] as double,
        compareAtPrice: result['compareAtPrice'] as double?,
        stock: result['stock'] as int?,
        flashSaleEnabled: result['flashSaleEnabled'] as bool? ?? false,
        flashSaleEndDate: result['flashSaleEndDate'] != null
            ? DateTime.tryParse(result['flashSaleEndDate'] as String)
            : null,
      );

      setState(() {
        // Remove any existing local edits for this SKU
        _localSkus.removeWhere((s) => s.skuId == sku.id);
        // Add the edited SKU to local state
        _localSkus.add(editedSku);
      });
    }
  }

  /// Build the full variants list including color + other attributes
  List<VariantOption> _buildAllVariants() {
    final variants = <VariantOption>[];

    // Add color as first variant if selected
    if (_selectedColorId != null && _selectedColorId!.isNotEmpty) {
      final colorAttr = _variationDetailBloc.state.variationAttributes
          .where((a) => a.name.toLowerCase() == 'color')
          .firstOrNull;
      if (colorAttr != null) {
        variants.add(VariantOption(
          attributeId: colorAttr.id,
          valueId: _selectedColorId!,
        ));
      }
    }

    // Add other selected attributes
    variants.addAll(
      _selectedAttributes
          .where((a) => a.isComplete)
          .map((a) => VariantOption(attributeId: a.attributeId, valueId: a.valueId!)),
    );

    return variants;
  }

  void _onDone() {
    final variants = _buildAllVariants();

    // Use the ObjectIds we stored from image management screen
    final finalImageIds = _reorderedImageIds ?? _variationDetailBloc.state.variation?.imageIds ?? [];

    // Build local SKUs data for the request (includes both new and edited SKUs)
    final localSkusData = _localSkus
        .where((sku) => sku.price > 0)
        .map((sku) => LocalSkuData(
              skuId: sku.skuId, // Will be null for new SKUs, populated for edited ones
              attributeId: sku.attributeId,
              attributeOptionId: sku.attributeOptionId,
              price: sku.price,
              compareAtPrice: sku.compareAtPrice,
              stock: sku.stock,
              flashSaleEnabled: sku.flashSaleEnabled,
              flashSaleEndDate: sku.flashSaleEndDate,
            ))
        .toList();

    // Always update - save variation with attributes, images, and new SKUs
    _waitingForUpdate = true;
    _variationDetailBloc.add(
      VariationUpdateRequested(
        variationId: widget.variationId,
        variants: variants,
        existingImageIds: finalImageIds,
        newImages: [],
        localSkus: localSkusData,
      ),
    );
  }

  /// Save images immediately after upload to prevent data loss
  void _saveImagesImmediately(List<String> imageIds) {
    print('💾 Saving images immediately to variation');

    // Get current variants (if any) to preserve them
    final currentVariants = _buildAllVariants();

    // Mark this as a background image save (no navigation)
    _savingImagesOnly = true;

    // Update variation with new images only (no SKUs, just images)
    _variationDetailBloc.add(
      VariationUpdateRequested(
        variationId: widget.variationId,
        variants: currentVariants,
        existingImageIds: imageIds,
        newImages: [],
        localSkus: [], // Don't create SKUs during image save
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
          'Remove Variation',
          style: AppTypography.titleLM.copyWith(color: AppColors.textPrimary),
        ),
        content: Text(
          'Are you sure you want to remove this variation? It will be archived and can be restored later.',
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
              _variationDetailBloc.add(
                VariationArchiveRequested(variationId: widget.variationId),
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

            // Separate Color from other attributes
            final allVariants = state.variation!.variants;
            final colorVariant = allVariants
                .where((v) => v.attributeName.toLowerCase() == 'color')
                .toList();
            final otherVariants = allVariants
                .where((v) => v.attributeName.toLowerCase() != 'color')
                .toList();

            setState(() {
              // Populate color
              if (colorVariant.isNotEmpty) {
                _selectedColorId = colorVariant.first.valueId;
                _selectedColorName = colorVariant.first.valueName;
              }

              // Populate other attributes
              if (otherVariants.isNotEmpty) {
                _selectedAttributes = otherVariants
                    .map(
                      (v) => SelectedAttribute(
                        attributeId: v.attributeId,
                        attributeName: v.attributeName,
                        valueId: v.valueId,
                        valueName: v.valueName,
                      ),
                    )
                    .toList();
              }
            });
          }

          if (state.status == VariationDetailStatus.failure) {
            _waitingForUpdate = false;
            Loader.hide();
            AppSnackbar.error(context, state.errorMessage ?? 'An error occurred');
          }

          // Show loading overlay when image is being removed
          if (state.status == VariationDetailStatus.imageRemoving) {
            Loader.show(
              context,
              progressIndicator: const CircularProgressIndicator(
                color: AppColors.textPrimary,
              ),
              overlayColor: Colors.black54,
            );
          }

          // When image is removed successfully, hide loader, clear image cache and refresh
          if (state.status == VariationDetailStatus.imageRemoveSuccess) {
            Loader.hide();
            // Clear image cache to prevent showing old cached images
            imageCache.clear();
            imageCache.clearLiveImages();
            getIt<VariationsBloc>().add(const VariationsRefreshRequested());
            getIt<SellBloc>().add(const SellRefreshRequested());
            getIt<UserProductsBloc>().add(const UserProductsRefreshRequested());
          }

          // When images are reordered successfully, clear cache and refresh
          if (state.status == VariationDetailStatus.loaded && 
              state.variation != null &&
              _waitingForImageReorder) {
            print('✅ Image reorder completed successfully');
            print('📷 Updated variation images: ${state.variation?.images}');
            _waitingForImageReorder = false;
            // Clear local reordered images since variation is now updated
            _reorderedImages = null;
            // Clear image cache to ensure updated images are shown
            imageCache.clear();
            imageCache.clearLiveImages();
            // Force UI rebuild
            setState(() {});
          }

          // When variation update succeeds (image-only save - no navigation)
          if (state.status == VariationDetailStatus.updateSuccess &&
              _savingImagesOnly) {
            _savingImagesOnly = false;
            print('✅ Images saved successfully to variation');
            // Clear local image state since they're now saved
            setState(() {
              _reorderedImages = null;
              _reorderedImageIds = null;
            });
            // Refresh variation to show saved images
            _variationDetailBloc.add(
              VariationDetailLoadRequested(
                variationId: widget.variationId,
                categoryId: widget.categoryId,
              ),
            );
          }

          // When variation update succeeds (full save - may navigate)
          if (state.status == VariationDetailStatus.updateSuccess &&
              _waitingForUpdate) {
            _waitingForUpdate = false;
            // Clear selected images and local SKUs since they've been saved
            setState(() {
              _selectedImages = [];
              _localSkus = [];
            });
            getIt<VariationsBloc>().add(const VariationsRefreshRequested());
            getIt<SellBloc>().add(const SellRefreshRequested());
            getIt<UserProductsBloc>().add(const UserProductsRefreshRequested());
            
            // If variation has SKUs, navigate back to style overview
            if (state.skus.isNotEmpty) {
              AppSnackbar.success(context, 'Variation saved');
              _navigateBack();
            } else {
              AppSnackbar.success(context, 'Variation saved');
              // Reload to get fresh data with saved attributes
              _variationDetailBloc.add(
                VariationDetailLoadRequested(
                  variationId: widget.variationId,
                  categoryId: widget.categoryId,
                ),
              );
            }
          }

          // When variation archive succeeds, navigate back
          if (state.status == VariationDetailStatus.archiveSuccess) {
            AppSnackbar.success(context, 'Variation removed');
            getIt<VariationsBloc>().add(const VariationsRefreshRequested());
            getIt<SellBloc>().add(const SellRefreshRequested());
            _navigateBack();
          }
        },
        builder: (context, state) {
          final isLoading = state.status == VariationDetailStatus.loading;
          final isCreatingSku =
              state.status == VariationDetailStatus.skuCreating;
          final isUpdating = state.status == VariationDetailStatus.updating;
          final isArchiving = state.status == VariationDetailStatus.archiving;
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
                                // Image validation error banner (rejected images)
                                if (variation?.isImageRejected == true)
                                  Padding(
                                    padding: const EdgeInsets.all(20),
                                    child: AppInfoBanner.error(
                                      title: 'Images Rejected',
                                      text: variation!.imageValidationNotes ??
                                          'Your product images were rejected. Please upload new images that clearly show the product.',
                                    ),
                                  ),

                                // Draft status info banner (only show if no image issues)
                                if (variation?.isDraft == true && variation?.hasImageIssues != true)
                                  const Padding(
                                    padding: EdgeInsets.all(20),
                                    child: AppInfoBanner.info(
                                      text: 'This variation is in draft status. It won\'t be visible to buyers until it has at least 3 photos, attributes, and one active SKU with pricing.',
                                    ),
                                  ),

                                // Photos section
                                _buildPhotosSection(variation),

                                // Color section (required, always first)
                                ColorSection(
                                  colorAttribute: state.variationAttributes
                                      .where((a) => a.name.toLowerCase() == 'color')
                                      .firstOrNull,
                                  selectedColorId: _selectedColorId,
                                  selectedColorName: _selectedColorName,
                                  onColorSelected: (colorId, colorName) {
                                    setState(() {
                                      _selectedColorId = colorId;
                                      _selectedColorName = colorName;
                                    });
                                  },
                                ),

                                // Attributes section (other attributes, excluding Color)
                                AttributesSection(
                                  availableAttributes: state.variationAttributes
                                      .where((a) => a.name.toLowerCase() != 'color')
                                      .toList(),
                                  selectedAttributes: _selectedAttributes,
                                  onAttributesChanged: (attributes) {
                                    setState(() {
                                      _selectedAttributes = attributes;
                                    });
                                  },
                                  onAddAttribute: state.variationAttributes
                                      .where((a) => a.name.toLowerCase() != 'color')
                                      .isNotEmpty
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
                    existingImages: _reorderedImages ?? variation?.images ?? [],
                    isUpdating: isUpdating,
                    skus: state.skus,
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
    final totalSkus = skus.length + _localSkus.length;
    final hasAnySkus = totalSkus > 0;

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
                'SKUs & Pricing',
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
                    : Text(
                        'ADD',
                        style: AppTypography.bodyM.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
              ),
            ],
          ),
        ),

        // SKUs list
        if (!hasAnySkus)
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
                    'Tap ADD to add size and price',
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.textHint,
                    ),
                  ),
                ],
              ),
            ),
          )
        else ...[
          // Saved SKUs (filter out ones that have been edited locally)
          ...skus
              .where((sku) => !_localSkus.any((local) => local.skuId == sku.id))
              .map((sku) => _buildSkuItem(sku)),
          // Local SKUs (both new and edited)
          ..._localSkus.map((sku) => _buildLocalSkuItem(sku)),
        ],
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
              '${CurrencyUtils.currentSymbol} $price',
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

  Widget _buildLocalSkuItem(LocalSku sku) {
    final isEdited = sku.isExisting; // Has skuId = editing existing SKU

    return GestureDetector(
      onTap: () => _onLocalSkuTap(sku),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.05),
          border: const Border(
            bottom: BorderSide(color: AppColors.secondary, width: 1),
          ),
        ),
        child: Row(
          children: [
            // Unsaved/Edited indicator
            Container(
              width: 8,
              height: 8,
              margin: const EdgeInsets.only(right: 12),
              decoration: BoxDecoration(
                color: isEdited ? AppColors.primary : AppColors.warning,
                shape: BoxShape.circle,
              ),
            ),
            Expanded(
              child: Text(
                sku.optionName,
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            Text(
              sku.price > 0
                  ? '${CurrencyUtils.currentSymbol} ${sku.price.toStringAsFixed(0)}'
                  : 'Set price',
              style: AppTypography.bodyM.copyWith(
                fontWeight: FontWeight.w700,
                color: sku.price > 0 ? AppColors.textPrimary : AppColors.warning,
              ),
            ),
            const SizedBox(width: 12),
            // Delete button
            GestureDetector(
              onTap: () => _onRemoveLocalSku(sku),
              child: PhosphorIcon(
                PhosphorIcons.x(),
                color: AppColors.textSecondary,
                size: 18,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomSection({
    required List<String> existingImages,
    required bool isUpdating,
    required List<dynamic> skus,
  }) {
    final isValid = _isFormValid(existingImages);
    final totalSkus = skus.length + _localSkus.where((s) => s.price > 0).length;
    final hasSkus = totalSkus > 0;

    return Container(
      color: AppColors.background,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: SizedBox(
            width: double.infinity,
            child: AppButton(
              text: hasSkus ? 'Save & Continue' : 'Save',
              isLoading: isUpdating,
              onPressed: isValid && !isUpdating ? _onDone : null,
            ),
          ),
        ),
      ),
    );
  }



  Widget _buildPhotosSection(dynamic variation) {
    // Use reordered images if available, otherwise fall back to variation images
    final images = _reorderedImages ?? variation?.images ?? [];
    
    return GestureDetector(
      onTap: () async {
        print('🚀 Opening image management screen');
        print('📷 Passing images: ${images.length}');
        print('📷 Image URLs: ${images.take(3).join(' | ')}');
        
        final result = await context.push(
          '/image-management',
          extra: {
            'existingImages': images.map((url) {
              final index = images.indexOf(url);
              return {
                'url': url,
                'id': index < (variation?.imageIds.length ?? 0)
                    ? variation!.imageIds[index]
                    : 'MISSING_ID'
              };
            }).toList(),
            'selectedImages': _selectedImages,
            'maxImages': 15,
            'authenticity': widget.authenticity,
            'onImagesChanged': (List<String> allOrderedImages) {
              setState(() {
                // Store display URLs for UI
                _reorderedImages = allOrderedImages;
                debugPrint('✅ Received ${allOrderedImages.length} total images');
                debugPrint('📷 All images: ${allOrderedImages.map((i) => i.split('/').last).take(3).join(' | ')}');
              });
            },
          },
        );
        
        // Handle the result Map with both URLs and ObjectIds
        if (result is Map<String, dynamic>) {
          final imageUrls = result['imageUrls'] as List<String>?;
          final imageIds = result['imageIds'] as List<String>?;
          
          if (imageUrls != null && imageIds != null) {
            setState(() {
              _reorderedImages = imageUrls;  // For display
              _reorderedImageIds = imageIds; // For server
            });
            
            print('✅ Received from image management:');
            print('📷 URLs: ${imageUrls.length}');
            print('📷 ObjectIds: ${imageIds.length}');
            
            // Immediately save the variation with updated images to prevent data loss
            _saveImagesImmediately(imageIds);
          }
        }
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(color: AppColors.secondary, width: 1),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: Photos label and chevron
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Photos',
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
                PhosphorIcon(
                  PhosphorIconsRegular.caretRight,
                  size: 14,
                  color: AppColors.textPrimary,
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            // Bottom row: Images preview
            if (images.isNotEmpty) 
              Row(
                children: [
                  // Show first 3 images as small thumbnails
                  ...images.take(3).map((imageUrl) => Container(
                    margin: const EdgeInsets.only(right: 1),
                    child: Container(
                      width: 32,
                      height: 26,
                      decoration: BoxDecoration(
                        image: DecorationImage(
                          image: NetworkImage(imageUrl),
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                  )),
                  
                  // Show "+ X more" text if there are more than 3 images
                  if (images.length > 3) ...[
                    const SizedBox(width: 14),
                    Text(
                      '+ ${images.length - 3} more',
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ],
              )
            else
              Text(
                'Add photos',
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
