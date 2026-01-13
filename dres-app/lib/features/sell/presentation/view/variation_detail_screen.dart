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
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/features/sell/logic/variation_detail_bloc/variation_detail_bloc.dart';
import 'package:dres/features/sell/logic/variations_bloc/variations_bloc.dart';
import 'package:dres/features/sell/logic/sell_bloc/sell_bloc.dart';
import 'package:dres/features/sell/presentation/widgets/item_photos_section.dart';
import 'package:dres/features/sell/presentation/widgets/attributes_section.dart';
import 'package:dres/features/profile/logic/user_products_bloc/user_products_bloc.dart';

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

  // Track if we're waiting for image reorder to complete
  bool _waitingForImageReorder = false;

  // Store reordered images locally until variation updates
  List<String>? _reorderedImages;
  
  // Store ObjectIds separately for server requests
  List<String>? _reorderedImageIds;

  /// Check if the variation form is valid (can be saved)
  /// Requires: 3+ images, 1+ attribute selected
  /// SKUs are added after variation is saved with attributes
  bool _isFormValid(List<String> existingImages) {
    final totalImages = existingImages.length + _selectedImages.length;
    final hasEnoughImages = totalImages >= 3;
    final hasAttribute = _selectedAttributes.any((a) => a.isComplete);

    return hasEnoughImages && hasAttribute;
  }

  /// Check if variation has saved attributes (variants) - required before adding SKUs
  bool _hasVariationAttributes() {
    final variation = _variationDetailBloc.state.variation;
    return variation != null && variation.variants.isNotEmpty;
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

  void _onAddSku() {
    // Check if variation has saved attributes first
    if (!_hasVariationAttributes()) {
      AppSnackbar.error(context, 'Please save variation with attributes first before adding SKUs');
      return;
    }

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
        stock: 0, // Will be set in detail page
      ),
    );
  }

  void _onSkuTap(dynamic sku) async {
    // Navigate to SKU detail page (inside shell) and wait for result
    await context.push(
      '/sell/style/${widget.styleId}/variation/${widget.variationId}/sku/${sku.id}',
      extra: {
        'variationName': widget.variationName,
        'categoryId': widget.categoryId,
      },
    );
    // Reload variation detail when returning from SKU screen
    _variationDetailBloc.add(
      VariationDetailLoadRequested(
        variationId: widget.variationId,
        categoryId: widget.categoryId,
      ),
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

    // Use the ObjectIds we stored from image management screen
    final finalImageIds = _reorderedImageIds ?? _variationDetailBloc.state.variation?.imageIds ?? [];
    
    print('🔍 DEBUG: Using stored ObjectIds for server:');
    for (int i = 0; i < finalImageIds.length; i++) {
      print('  [$i]: "${finalImageIds[i]}"');
    }
    
    print('📷 Final ObjectIds for update: ${finalImageIds.length}');

    // Always update - even if no attributes, we need to save images
    _waitingForUpdate = true;
    _variationDetailBloc.add(
      VariationUpdateRequested(
        variationId: widget.variationId,
        variants: variants,
        existingImageIds: finalImageIds, // Use final ordered image IDs
        newImages: [], // No new images since they were already uploaded in image management
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

          // When SKU is created, just show success message - don't auto-navigate
          // User can manually tap on the SKU to edit it
          if (state.status == VariationDetailStatus.skuCreateSuccess &&
              _waitingForSkuCreation) {
            _waitingForSkuCreation = false;
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Size added successfully'),
                backgroundColor: AppColors.success,
              ),
            );
          }

          if (state.status == VariationDetailStatus.failure) {
            _waitingForSkuCreation = false;
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

          // When variation update succeeds, stay on screen and show success
          if (state.status == VariationDetailStatus.updateSuccess &&
              _waitingForUpdate) {
            _waitingForUpdate = false;
            // Clear selected images since they've been uploaded
            setState(() {
              _selectedImages = [];
            });
            getIt<VariationsBloc>().add(const VariationsRefreshRequested());
            getIt<SellBloc>().add(const SellRefreshRequested());
            getIt<UserProductsBloc>().add(const UserProductsRefreshRequested());
            AppSnackbar.success(context, 'Variation saved');
            // Reload to get fresh data with saved attributes
            _variationDetailBloc.add(
              VariationDetailLoadRequested(
                variationId: widget.variationId,
                categoryId: widget.categoryId,
              ),
            );
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
                                // Photos section
                                _buildPhotosSection(variation),

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
                    existingImages: _reorderedImages ?? variation?.images ?? [],
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
    final hasAttributes = _hasVariationAttributes();

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
                    : Text(
                        'ADD',
                        style: AppTypography.bodyM.copyWith(
                          fontWeight: FontWeight.w700,
                          color: hasAttributes
                              ? AppColors.textPrimary
                              : AppColors.textHint,
                        ),
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
                    hasAttributes
                        ? 'Tap ADD to add size and price'
                        : 'Save variation with attributes first',
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

  Widget _buildBottomSection({
    required List<String> existingImages,
    required bool isUpdating,
  }) {
    final isValid = _isFormValid(existingImages);

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
