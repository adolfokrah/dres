import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/app_snackbar.dart';
import 'package:dres/features/sell/logic/style_details_bloc/style_details_bloc.dart';
import 'package:dres/features/sell/logic/variations_bloc/variations_bloc.dart';
import 'package:dres/features/sell/logic/sell_bloc/sell_bloc.dart';
import 'package:dres/features/sell/data/models/variation_model.dart';
import 'package:dres/features/profile/logic/user_products_bloc/user_products_bloc.dart';

/// Hub screen for managing a product listing
/// Shows: Product Details section + Variations list with status
class StyleOverviewScreen extends StatefulWidget {
  final String styleId;

  const StyleOverviewScreen({
    super.key,
    required this.styleId,
  });

  @override
  State<StyleOverviewScreen> createState() => _StyleOverviewScreenState();
}

class _StyleOverviewScreenState extends State<StyleOverviewScreen> {
  late final StyleDetailsBloc _styleDetailsBloc;
  late final VariationsBloc _variationsBloc;

  @override
  void initState() {
    super.initState();
    _styleDetailsBloc = getIt<StyleDetailsBloc>();
    _variationsBloc = getIt<VariationsBloc>();
    _loadData();
  }

  void _loadData() {
    _styleDetailsBloc.add(StyleDetailsLoadRequested(styleId: widget.styleId));
    _variationsBloc.add(VariationsLoadRequested(styleId: widget.styleId));
  }

  void _onEditProductDetails() async {
    await context.push('/sell/style/${widget.styleId}/edit');
    _loadData();
  }

  void _onAddVariation() {
    _variationsBloc.add(VariationCreateRequested(styleId: widget.styleId));
  }

  void _onVariationTap(VariationModel variation) async {
    final styleDetails = _styleDetailsBloc.state.styleDetails;
    await context.push(
      '/sell/style/${widget.styleId}/variation/${variation.id}',
      extra: {
        'variationName': variation.displayName,
        'categoryId': styleDetails?.categoryId,
      },
    );
    _loadData();
  }

  void _onPublish() {
    // Check if we have at least one complete variation with SKU
    final variations = _variationsBloc.state.variations;
    final hasCompleteVariation = variations.any((v) => 
      v.images.isNotEmpty && 
      v.variants.isNotEmpty && 
      v.skus.isNotEmpty
    );

    if (!hasCompleteVariation) {
      AppSnackbar.error(
        context, 
        'Add at least one variation with photos, color, and pricing',
      );
      return;
    }

    // Update style status to published
    _styleDetailsBloc.add(StyleDetailsPublishRequested(styleId: widget.styleId));
  }

  void _onUnpublish() {
    _styleDetailsBloc.add(StyleDetailsUnpublishRequested(styleId: widget.styleId));
  }

  bool _canPublish() {
    final variations = _variationsBloc.state.variations;
    return variations.any((v) => 
      v.images.length >= 3 && 
      v.variants.isNotEmpty && 
      v.skus.isNotEmpty
    );
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _styleDetailsBloc),
        BlocProvider.value(value: _variationsBloc),
      ],
      child: BlocListener<StyleDetailsBloc, StyleDetailsState>(
        listener: (context, state) {
          if (state.status == StyleDetailsStatus.publishSuccess) {
            AppSnackbar.success(context, 'Listing published successfully');
            getIt<SellBloc>().add(const SellRefreshRequested());
            getIt<UserProductsBloc>().add(const UserProductsRefreshRequested());
          }
          if (state.status == StyleDetailsStatus.unpublishSuccess) {
            AppSnackbar.success(context, 'Listing unpublished');
            getIt<SellBloc>().add(const SellRefreshRequested());
            getIt<UserProductsBloc>().add(const UserProductsRefreshRequested());
          }
          if (state.status == StyleDetailsStatus.failure) {
            AppSnackbar.error(context, state.errorMessage ?? 'An error occurred');
          }
        },
        child: BlocListener<VariationsBloc, VariationsState>(
          listener: (context, state) {
            if (state.status == VariationsStatus.createSuccess &&
                state.createdVariationId != null) {
              final styleDetails = _styleDetailsBloc.state.styleDetails;
              context.push(
                '/sell/style/${widget.styleId}/variation/${state.createdVariationId}',
                extra: {
                  'variationName': 'New Variation',
                  'categoryId': styleDetails?.categoryId,
                },
              ).then((_) => _loadData());
            }
            if (state.status == VariationsStatus.failure) {
              AppSnackbar.error(context, state.errorMessage ?? 'An error occurred');
            }
          },
          child: Scaffold(
            backgroundColor: AppColors.background,
            body: SafeArea(
              child: Column(
                children: [
                  // Header
                  _buildHeader(),
                  // Content
                  Expanded(
                    child: _buildContent(),
                  ),
                  // Bottom button
                  _buildBottomSection(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return BlocBuilder<StyleDetailsBloc, StyleDetailsState>(
      builder: (context, state) {
        final title = state.styleDetails?.title ?? 'My Listing';
        return UnifiedHeader.titleOnly(
          title: title,
          onBackTap: () {
            getIt<SellBloc>().add(const SellRefreshRequested());
            context.pop();
          },
        );
      },
    );
  }

  Widget _buildContent() {
    return BlocBuilder<StyleDetailsBloc, StyleDetailsState>(
      builder: (context, styleState) {
        if (styleState.status == StyleDetailsStatus.loading) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.textPrimary),
          );
        }

        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product Details Section
              _buildProductDetailsSection(styleState),
              
              // Variations Section
              _buildVariationsSection(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildProductDetailsSection(StyleDetailsState state) {
    final details = state.styleDetails;
    final isComplete = details != null &&
        details.title != null &&
        details.title!.isNotEmpty &&
        details.categoryId != null;

    return Container(
      margin: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(
          color: isComplete ? AppColors.success : AppColors.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              border: Border(
                bottom: BorderSide(color: AppColors.border),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: isComplete 
                        ? AppColors.success.withOpacity(0.1) 
                        : AppColors.background,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isComplete ? AppColors.success : AppColors.border,
                    ),
                  ),
                  child: Center(
                    child: isComplete
                        ? Icon(
                            PhosphorIcons.check(PhosphorIconsStyle.bold),
                            color: AppColors.success,
                            size: 16,
                          )
                        : Text(
                            '1',
                            style: AppTypography.bodyS.copyWith(
                              fontWeight: FontWeight.bold,
                              color: AppColors.textSecondary,
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'PRODUCT DETAILS',
                    style: AppTypography.bodyS.copyWith(
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: _onEditProductDetails,
                  child: Text(
                    'Edit',
                    style: AppTypography.bodyS.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  details?.title ?? 'No title',
                  style: AppTypography.bodyL.copyWith(
                    fontWeight: FontWeight.w600,
                    color: details?.title != null 
                        ? AppColors.textPrimary 
                        : AppColors.textHint,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _buildCategoryBreadcrumb(details),
                  style: AppTypography.bodyS.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                if (details?.brandName != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    details!.brandName!,
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _buildCategoryBreadcrumb(dynamic details) {
    if (details == null) return 'No category selected';
    
    final parts = <String>[];
    if (details.departmentName != null) parts.add(details.departmentName!);
    if (details.collectionName != null) parts.add(details.collectionName!);
    if (details.categoryName != null) parts.add(details.categoryName!);
    
    return parts.isNotEmpty ? parts.join(' > ') : 'No category selected';
  }

  Widget _buildVariationsSection() {
    return BlocBuilder<VariationsBloc, VariationsState>(
      builder: (context, state) {
        final isLoading = state.status == VariationsStatus.loading;
        final isCreating = state.status == VariationsStatus.creating;
        final variations = state.variations;
        
        // Check if at least one variation is complete
        final hasCompleteVariation = variations.any((v) => 
          v.images.length >= 3 && 
          v.variants.isNotEmpty && 
          v.skus.isNotEmpty
        );

        return Container(
          margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          decoration: BoxDecoration(
            color: AppColors.surface,
            border: Border.all(
              color: hasCompleteVariation ? AppColors.success : AppColors.border,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Section header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: AppColors.border),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: hasCompleteVariation 
                            ? AppColors.success.withOpacity(0.1) 
                            : AppColors.background,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: hasCompleteVariation ? AppColors.success : AppColors.border,
                        ),
                      ),
                      child: Center(
                        child: hasCompleteVariation
                            ? Icon(
                                PhosphorIcons.check(PhosphorIconsStyle.bold),
                                color: AppColors.success,
                                size: 16,
                              )
                            : Text(
                                '2',
                                style: AppTypography.bodyS.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'VARIATIONS',
                        style: AppTypography.bodyS.copyWith(
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                    if (variations.isNotEmpty)
                      Text(
                        '${variations.length}',
                        style: AppTypography.bodyS.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                  ],
                ),
              ),
              // Variations list
              if (isLoading)
                const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(
                    child: CircularProgressIndicator(color: AppColors.textPrimary),
                  ),
                )
              else if (variations.isEmpty)
                _buildEmptyVariations()
              else
                ...variations.map((v) => _buildVariationItem(v)),
              
              // Add variation button
              Container(
                decoration: const BoxDecoration(
                  border: Border(
                    top: BorderSide(color: AppColors.border),
                  ),
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: isCreating ? null : _onAddVariation,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (isCreating)
                            const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.textPrimary,
                              ),
                            )
                          else
                            PhosphorIcon(
                              PhosphorIcons.plus(),
                              size: 16,
                              color: AppColors.textPrimary,
                            ),
                          const SizedBox(width: 8),
                          Text(
                            'Add Variation',
                            style: AppTypography.bodyM.copyWith(
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyVariations() {
    return Padding(
      padding: const EdgeInsets.all(40),
      child: Center(
        child: Column(
          children: [
            PhosphorIcon(
              PhosphorIcons.tShirt(),
              size: 40,
              color: AppColors.textHint,
            ),
            const SizedBox(height: 12),
            Text(
              'No variations yet',
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textHint,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Add color variations of your product',
              style: AppTypography.bodyS.copyWith(
                color: AppColors.textHint,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVariationItem(VariationModel variation) {
    final status = _getVariationStatus(variation);
    final statusColor = _getStatusColor(status);
    final statusIcon = _getStatusIcon(status);
    final skuText = _getSkuText(variation);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _onVariationTap(variation),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            border: Border(
              bottom: BorderSide(color: AppColors.border),
            ),
          ),
          child: Row(
            children: [
              // Color indicator / thumbnail
              if (variation.images.isNotEmpty)
                ClipRRect(
                  child: CachedNetworkImage(
                    imageUrl: variation.images.first,
                    width: 48,
                    height: 48,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      width: 48,
                      height: 48,
                      color: AppColors.secondary,
                    ),
                    errorWidget: (context, url, error) => Container(
                      width: 48,
                      height: 48,
                      color: AppColors.secondary,
                      child: Icon(
                        PhosphorIcons.image(),
                        color: AppColors.textHint,
                      ),
                    ),
                  ),
                )
              else
                Container(
                  width: 48,
                  height: 48,
                  color: AppColors.secondary,
                  child: Icon(
                    PhosphorIcons.image(),
                    color: AppColors.textHint,
                  ),
                ),
              const SizedBox(width: 16),
              // Variation info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      variation.displayName,
                      style: AppTypography.bodyM.copyWith(
                        fontWeight: FontWeight.w500,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      skuText,
                      style: AppTypography.bodyS.copyWith(
                        color: statusColor,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(
                statusIcon,
                size: 18,
                color: statusColor,
              ),
              const SizedBox(width: 8),
              PhosphorIcon(
                PhosphorIcons.caretRight(),
                size: 20,
                color: AppColors.textSecondary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  VariationStatus _getVariationStatus(VariationModel variation) {
    if (variation.images.length < 3 || variation.variants.isEmpty) {
      return VariationStatus.incomplete;
    }
    if (variation.skus.isEmpty) {
      return VariationStatus.needsSku;
    }
    return VariationStatus.complete;
  }

  Color _getStatusColor(VariationStatus status) {
    switch (status) {
      case VariationStatus.complete:
        return AppColors.success;
      case VariationStatus.needsSku:
        return AppColors.warning;
      case VariationStatus.incomplete:
        return AppColors.textSecondary;
    }
  }

  IconData _getStatusIcon(VariationStatus status) {
    switch (status) {
      case VariationStatus.complete:
        return PhosphorIcons.checkCircle(PhosphorIconsStyle.fill);
      case VariationStatus.needsSku:
        return PhosphorIcons.warning(PhosphorIconsStyle.fill);
      case VariationStatus.incomplete:
        return PhosphorIcons.circle();
    }
  }

  String _getSkuText(VariationModel variation) {
    final status = _getVariationStatus(variation);
    final skuCount = variation.skus.length;
    switch (status) {
      case VariationStatus.complete:
        return '$skuCount SKU${skuCount > 1 ? 's' : ''}';
      case VariationStatus.needsSku:
        return 'No SKUs - add pricing';
      case VariationStatus.incomplete:
        if (variation.images.length < 3) {
          return 'Add ${3 - variation.images.length} more photo${3 - variation.images.length > 1 ? 's' : ''}';
        }
        return 'Incomplete - add color';
    }
  }

  Widget _buildBottomSection() {
    return BlocBuilder<StyleDetailsBloc, StyleDetailsState>(
      builder: (context, styleState) {
        return BlocBuilder<VariationsBloc, VariationsState>(
          builder: (context, variationsState) {
            final isPublished = styleState.styleDetails?.status == 'published';
            final canPublish = _canPublish();
            final isLoading = styleState.status == StyleDetailsStatus.loading ||
                styleState.status == StyleDetailsStatus.publishing;

            return Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(
                  top: BorderSide(color: AppColors.border),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (!canPublish && !isPublished)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        children: [
                          PhosphorIcon(
                            PhosphorIcons.info(),
                            size: 16,
                            color: AppColors.textHint,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Add at least 1 complete variation to publish',
                              style: AppTypography.bodyS.copyWith(
                                color: AppColors.textHint,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  AppButton.filled(
                    text: isPublished ? 'Unpublish Listing' : 'Review & Publish',
                    onPressed: isLoading
                        ? null
                        : (isPublished ? _onUnpublish : (canPublish ? _onPublish : null)),
                    isLoading: isLoading,
                    isFullWidth: true,
                    backgroundColor: isPublished ? AppColors.error : null,
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

enum VariationStatus {
  complete,
  needsSku,
  incomplete,
}
