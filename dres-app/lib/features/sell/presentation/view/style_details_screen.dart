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
import 'package:dres/core/widgets/app_text_field.dart';
import 'package:dres/core/widgets/app_text_area.dart';
import 'package:dres/core/widgets/app_snackbar.dart';
import 'package:dres/core/widgets/app_info_banner.dart';
import 'package:dres/features/sell/presentation/widgets/sell_selector_row.dart';
import 'package:dres/features/sell/presentation/view/select_category_screen.dart';
import 'package:dres/features/sell/presentation/view/select_brand_screen.dart';
import 'package:dres/features/sell/logic/style_details_bloc/style_details_bloc.dart';
import 'package:dres/features/sell/logic/variations_bloc/variations_bloc.dart';
import 'package:dres/features/sell/logic/sell_bloc/sell_bloc.dart';
import 'package:dres/features/sell/data/models/variation_model.dart';
import 'package:dres/features/sell/data/models/style_models.dart';
import 'package:dres/features/profile/logic/user_products_bloc/user_products_bloc.dart';

class StyleDetailsScreen extends StatefulWidget {
  /// The style ID (required - must be created before navigating here)
  final String styleId;

  const StyleDetailsScreen({super.key, required this.styleId});

  @override
  State<StyleDetailsScreen> createState() => _StyleDetailsScreenState();
}

class _StyleDetailsScreenState extends State<StyleDetailsScreen> {
  late final StyleDetailsBloc _styleDetailsBloc;
  late final VariationsBloc _variationsBloc;
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();

  // Selected category data (stores IDs for API submission)
  String? _selectedDepartmentId;
  String? _selectedDepartmentName;
  String? _selectedCollectionId;
  String? _selectedCollectionName;
  String? _selectedCategoryId;
  String? _selectedCategoryName;

  // Selected brand data
  String? _selectedBrandId;
  String? _selectedBrandName;

  // Variations
  List<VariationModel> _variations = [];

  bool _isUpdating = false;

  @override
  void initState() {
    super.initState();
    _styleDetailsBloc = getIt<StyleDetailsBloc>();
    _variationsBloc = getIt<VariationsBloc>();
    // Load existing style data if available
    _styleDetailsBloc.add(StyleDetailsLoadRequested(styleId: widget.styleId));
    // Load variations for this style
    _variationsBloc.add(VariationsLoadRequested(styleId: widget.styleId));
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _populateFromState(StyleDetailsState state) {
    if (state.styleDetails != null) {
      final details = state.styleDetails!;

      if (_titleController.text.isEmpty && details.title != null) {
        _titleController.text = details.title!;
      }
      if (_descriptionController.text.isEmpty && details.description != null) {
        _descriptionController.text = details.description!;
      }
      if (_selectedDepartmentId == null && details.departmentId != null) {
        _selectedDepartmentId = details.departmentId;
        _selectedDepartmentName = details.departmentName;
      }
      if (_selectedCollectionId == null && details.collectionId != null) {
        _selectedCollectionId = details.collectionId;
        _selectedCollectionName = details.collectionName;
      }
      if (_selectedCategoryId == null && details.categoryId != null) {
        _selectedCategoryId = details.categoryId;
        _selectedCategoryName = details.categoryName;
      }
      if (_selectedBrandId == null && details.brandId != null) {
        _selectedBrandId = details.brandId;
        _selectedBrandName = details.brandName;
      }
    }
  }

  String get _categoryDisplayText {
    if (_selectedCategoryName != null) {
      final parts = <String>[];
      if (_selectedDepartmentName != null) parts.add(_selectedDepartmentName!);
      if (_selectedCollectionName != null) parts.add(_selectedCollectionName!);
      if (_selectedCategoryName != null) parts.add(_selectedCategoryName!);
      return parts.join(' / ');
    }
    return '';
  }

  bool get _canProceed {
    return _titleController.text.trim().isNotEmpty &&
        _selectedCategoryId != null &&
        _selectedBrandId != null;
  }

  Future<void> _onCategoryTap() async {
    final result = await context.push<SelectedCategoryData>(
      '/sell/select-department',
    );

    if (result != null) {
      setState(() {
        _selectedDepartmentId = result.departmentId;
        _selectedDepartmentName = result.departmentName;
        _selectedCollectionId = result.collectionId;
        _selectedCollectionName = result.collectionName;
        _selectedCategoryId = result.categoryId;
        _selectedCategoryName = result.categoryName;
      });
    }
  }

  Future<void> _onBrandTap() async {
    final result = await context.push<SelectedBrandData>('/sell/select-brand');

    if (result != null) {
      setState(() {
        _selectedBrandId = result.brandId;
        _selectedBrandName = result.brandName;
      });
    }
  }

  void _onSave() {
    if (!_canProceed || _isUpdating) return;

    // Update the style with the current data
    _styleDetailsBloc.add(
      StyleDetailsUpdateRequested(
        styleId: widget.styleId,
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        departmentId: _selectedDepartmentId,
        collectionId: _selectedCollectionId,
        categoryId: _selectedCategoryId!,
        brandId: _selectedBrandId!,
      ),
    );
  }

  void _onAddVariation() {
    if (_selectedCategoryId == null) {
      AppSnackbar.error(context, 'Please select a category first');
      return;
    }
    // Create a new variation and navigate to its detail page
    _variationsBloc.add(VariationCreateRequested(styleId: widget.styleId));
  }

  void _onBoostTap(StyleDetailsState state) {
    context.push(
      '/sell/style/${widget.styleId}/boost',
      extra: {
        'styleTitle': state.styleDetails?.title,
      },
    ).then((result) {
      // Refetch style details when returning from boost screen
      // especially if boost was successful
      if (result == true || result == null) {
        _styleDetailsBloc.add(
          StyleDetailsLoadRequested(
            styleId: widget.styleId,
          ),
        );
      }
    });
  }

  void _onStatsTap(StyleDetailsState state) {
    context.push(
      '/sell/style/${widget.styleId}/stats',
      extra: {
        'styleTitle': state.styleDetails?.title,
      },
    );
  }

  void _onVariationTap(VariationModel variation) {
    context.push(
      '/sell/style/${widget.styleId}/variation/${variation.id}',
      extra: {
        'variationName': variation.displayName,
        'categoryId': _selectedCategoryId,
      },
    ).then((_) {
      // Refetch style details when returning
      _styleDetailsBloc.add(
        StyleDetailsLoadRequested(
          styleId: widget.styleId,
        ),
      );
      // Also refresh variations
      _variationsBloc.add(
        VariationsLoadRequested(
          styleId: widget.styleId,
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _styleDetailsBloc,
      child: BlocConsumer<StyleDetailsBloc, StyleDetailsState>(
        listener: (context, state) {
          // Populate form when data is loaded
          if (state.status == StyleDetailsStatus.loaded) {
            _populateFromState(state);
            // Also populate variations from style details
            if (state.styleDetails != null && state.styleDetails!.variations.isNotEmpty) {
              final convertedVariations = state.styleDetails!.variations
                  .map((v) => v.toVariationModel(styleId: state.styleDetails!.id))
                  .toList();
              if (_variations.isEmpty || _variations.length != convertedVariations.length) {
                setState(() {
                  _variations = convertedVariations;
                });
              }
            }
            setState(() {});
          }

          // Handle updating state
          if (state.status == StyleDetailsStatus.updating) {
            setState(() => _isUpdating = true);
          }

          // Handle update success - show success message and reload style details
          if (state.status == StyleDetailsStatus.updateSuccess) {
            setState(() => _isUpdating = false);
            // Refetch drafts so it reflects the updated data
            getIt<SellBloc>().add(const SellRefreshRequested());
            // Reload style details to refresh the UI (enables ADD variation button)
            _styleDetailsBloc.add(StyleDetailsLoadRequested(styleId: widget.styleId));
            // Show success message
            AppSnackbar.success(context, 'Style saved successfully');
          }

          // Handle failure
          if (state.status == StyleDetailsStatus.failure) {
            setState(() => _isUpdating = false);
            AppSnackbar.error(context, state.errorMessage ?? 'Failed to update style');
          }

          // Handle publish success
          if (state.status == StyleDetailsStatus.publishSuccess) {
            getIt<SellBloc>().add(const SellRefreshRequested());
            getIt<UserProductsBloc>().add(const UserProductsRefreshRequested());
            AppSnackbar.success(context, 'Product published successfully');
          }

          // Handle unpublish success
          if (state.status == StyleDetailsStatus.unpublishSuccess) {
            getIt<SellBloc>().add(const SellRefreshRequested());
            getIt<UserProductsBloc>().add(const UserProductsRefreshRequested());
            AppSnackbar.success(context, 'Product unpublished successfully');
          }
        },
        builder: (context, state) {
          final isLoading = state.status == StyleDetailsStatus.loading;

          return Scaffold(
            backgroundColor: AppColors.background,
            body: SafeArea(
              child: Column(
                children: [
                  // Header
                  UnifiedHeader.titleOnly(
                    title: 'Product Details',
                    rightWidget: _buildHeaderAction(state),
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
                                // Active boost status banner (for boosted items)
                                if (state.styleDetails?.isBoosted == true &&
                                    state.styleDetails?.boostDetails != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 20, left: 20, right: 20),
                                    child: GestureDetector(
                                      onTap: state.styleDetails!.boostDetails!.hasAnalytics
                                          ? () => _onStatsTap(state)
                                          : null,
                                      child: _buildActiveBoostBanner(state.styleDetails!.boostDetails!),
                                    ),
                                  ),

                                // Boost promotion banner (only for published items that are not boosted)
                                if (state.styleDetails?.isPublished == true &&
                                    state.styleDetails?.isBoosted == false)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 20, left: 20, right: 20),
                                    child: GestureDetector(
                                      onTap: () => _onBoostTap(state),
                                      child: _buildBoostBanner(),
                                    ),
                                  ),

                                // Info banner
                                _buildInfoBanner(),

                                const SizedBox(height: 16),

                                // Title field
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                  ),
                                  child: AppTextField(
                                    label: 'Title',
                                    controller: _titleController,
                                    hintText: 'Enter product title',
                                    onChanged: (_) => setState(() {}),
                                  ),
                                ),

                                const SizedBox(height: 16),

                                // Description field
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                  ),
                                  child: AppTextArea(
                                    label: 'Description',
                                    controller: _descriptionController,
                                    hintText: 'Describe your item...',
                                    maxLines: 5,
                                    onChanged: (_) => setState(() {}),
                                  ),
                                ),

                                const SizedBox(height: 16),

                                // Category selector
                                SellSelectorRow(
                                  label: 'Category',
                                  value: _categoryDisplayText,
                                  onTap: _onCategoryTap,
                                ),

                                // Brand selector
                                SellSelectorRow(
                                  label: 'Brand',
                                  value: _selectedBrandName ?? '',
                                  onTap: _onBrandTap,
                                ),

                                // Variations section
                                BlocConsumer<VariationsBloc, VariationsState>(
                                  bloc: _variationsBloc,
                                  listener: (context, variationsState) {
                                    // Update local variations list
                                    if (variationsState.status ==
                                        VariationsStatus.loaded) {
                                      if (_variations !=
                                          variationsState.variations) {
                                        setState(() {
                                          _variations =
                                              variationsState.variations;
                                        });
                                      }
                                    }
                                    // Navigate to variation detail on create success
                                    if (variationsState.status ==
                                            VariationsStatus.createSuccess &&
                                        variationsState.createdVariationId !=
                                            null) {
                                      context.push(
                                        '/sell/style/${widget.styleId}/variation/${variationsState.createdVariationId}',
                                        extra: {
                                          'variationName': 'New Variation',
                                          'categoryId': _selectedCategoryId,
                                        },
                                      ).then((_) {
                                        // Refetch style details when returning
                                        _styleDetailsBloc.add(
                                          StyleDetailsLoadRequested(
                                            styleId: widget.styleId,
                                          ),
                                        );
                                        // Also refresh variations
                                        _variationsBloc.add(
                                          VariationsLoadRequested(
                                            styleId: widget.styleId,
                                          ),
                                        );
                                      });
                                    }
                                  },
                                  builder: (context, variationsState) {
                                    final isCreating =
                                        variationsState.status ==
                                        VariationsStatus.creating;
                                    return _buildVariationsSection(
                                      isCreating: isCreating,
                                      state: state,
                                    );
                                  },
                                ),
                              ],
                            ),
                          ),
                  ),

                  // Bottom buttons
                  _buildBottomButtons(),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildVariationsSection({
    required bool isCreating, 
    required StyleDetailsState state,
  }) {
    // Only allow adding variations if style title has been saved to backend
    final hasSavedTitle = state.styleDetails?.title != null && 
        state.styleDetails!.title!.trim().isNotEmpty;
    final canAddVariation = hasSavedTitle && !isCreating;
    
    return Column(
      children: [
        // Separator between brand and variations
        Container(height: 10, color: AppColors.secondary),

        // Header with + button
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
                'Variations',
                style: AppTypography.bodyL.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              GestureDetector(
                onTap: canAddVariation ? _onAddVariation : null,
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
                          color: canAddVariation 
                              ? AppColors.textPrimary 
                              : AppColors.textSecondary,
                        ),
                      ),
              ),
            ],
          ),
        ),

        // Variations list
        ...(_variations.map((variation) => _buildVariationRow(variation))),
      ],
    );
  }

  Widget _buildVariationRow(VariationModel variation) {
    return GestureDetector(
      onTap: () => _onVariationTap(variation),
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
                variation.displayName,
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
            ),
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

  Widget _buildInfoBanner() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: AppInfoBanner(
        title: 'Fill in your product details to create your listing.',
        text: 'Add a clear title, a good description, and select the correct category and brand before continuing.',
      ),
    );
  }

  Widget _buildBoostBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.warning.withOpacity(0.1),
        border: Border.all(color: AppColors.warning, width: 1),
      ),
      child: Row(
        children: [
          PhosphorIcon(
            PhosphorIcons.rocketLaunch(),
            color: AppColors.warning,
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Boost your listing',
                  style: AppTypography.bodyM.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Get more visibility and sell faster by boosting your product.',
                  style: AppTypography.bodyS.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          PhosphorIcon(
            PhosphorIcons.caretRight(),
            color: AppColors.textPrimary,
            size: 16,
          ),
        ],
      ),
    );
  }

  Widget _buildActiveBoostBanner(BoostDetailsModel boostDetails) {
    final daysRemaining = boostDetails.daysRemaining;
    final isExpiringSoon = boostDetails.isExpiringSoon;
    
    // Parse dates for display
    String formattedEndDate = '';
    if (boostDetails.endDate != null) {
      final endDate = DateTime.parse(boostDetails.endDate!);
      formattedEndDate = '${endDate.day}/${endDate.month}/${endDate.year}';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isExpiringSoon 
            ? AppColors.warning.withOpacity(0.1)
            : AppColors.success.withOpacity(0.1),
        border: Border.all(
          color: isExpiringSoon ? AppColors.warning : AppColors.success, 
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isExpiringSoon 
                  ? AppColors.warning.withOpacity(0.2)
                  : AppColors.success.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: PhosphorIcon(
              PhosphorIcons.rocketLaunch(),
              color: isExpiringSoon ? AppColors.warning : AppColors.success,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Boost Active',
                      style: AppTypography.bodyM.copyWith(
                        fontWeight: FontWeight.w700,
                        color: isExpiringSoon ? AppColors.warning : AppColors.success,
                      ),
                    ),
                    if (boostDetails.tierName != null) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.textPrimary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          boostDetails.tierName!,
                          style: AppTypography.caption.copyWith(
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        isExpiringSoon
                            ? 'Expires soon! $daysRemaining day${daysRemaining == 1 ? '' : 's'} left (ends $formattedEndDate)'
                            : '$daysRemaining day${daysRemaining == 1 ? '' : 's'} remaining • Ends $formattedEndDate',
                        style: AppTypography.bodyS.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                    if (boostDetails.hasAnalytics) ...[
                      const SizedBox(width: 8),
                      Row(
                        children: [
                          PhosphorIcon(
                            PhosphorIcons.chartBar(),
                            size: 14,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'View Stats',
                            style: AppTypography.caption.copyWith(
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: 2),
                          PhosphorIcon(
                            PhosphorIcons.caretRight(),
                            size: 12,
                            color: AppColors.textSecondary,
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomButtons() {
    return Container(
      padding: const EdgeInsets.all(20),
      width: double.infinity,
      child: AppButton.filled(
        text: _isUpdating ? 'Saving...' : 'Save',
        onPressed: _canProceed && !_isUpdating ? _onSave : null,
      ),
    );
  }

  Widget? _buildHeaderAction(StyleDetailsState state) {
    final styleDetails = state.styleDetails;
    if (styleDetails == null) return null;

    final isPublishing = state.status == StyleDetailsStatus.publishing;
    final isUnpublishing = state.status == StyleDetailsStatus.unpublishing;
    final isProcessing = isPublishing || isUnpublishing;

    if (styleDetails.isPublished) {
      // Show unpublish action
      return GestureDetector(
        onTap: isProcessing ? null : () => _showUnpublishDialog(),
        child: isUnpublishing
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.textPrimary,
                ),
              )
            : Text(
                'Unpublish',
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.error,
                  fontWeight: FontWeight.w600,
                ),
              ),
      );
    } else {
      // Show publish action for drafts
      return GestureDetector(
        onTap: isProcessing ? null : () => _showPublishDialog(),
        child: isPublishing
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.textPrimary,
                ),
              )
            : Text(
                'Publish',
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.success,
                  fontWeight: FontWeight.w600,
                ),
              ),
      );
    }
  }

  void _showPublishDialog() {
    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
          backgroundColor: AppColors.surface,
          title: Text(
            'Publish Product',
            style: AppTypography.titleLM.copyWith(color: AppColors.textPrimary),
          ),
          content: Text(
            'Publishing this product will make it visible to all buyers on the marketplace. Are you sure you want to publish?',
            style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(
                'Cancel',
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                _styleDetailsBloc.add(
                  StyleDetailsPublishRequested(styleId: widget.styleId),
                );
              },
              child: Text(
                'Publish',
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.success,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showUnpublishDialog() {
    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
          backgroundColor: AppColors.surface,
          title: Text(
            'Unpublish Product',
            style: AppTypography.titleLM.copyWith(color: AppColors.textPrimary),
          ),
          content: Text(
            'Unpublishing this product will hide it from the marketplace. Buyers will no longer be able to see or purchase it. Are you sure you want to unpublish?',
            style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(
                'Cancel',
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                _styleDetailsBloc.add(
                  StyleDetailsUnpublishRequested(styleId: widget.styleId),
                );
              },
              child: Text(
                'Unpublish',
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.error,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
