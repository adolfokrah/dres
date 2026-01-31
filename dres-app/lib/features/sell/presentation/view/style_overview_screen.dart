import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/app_snackbar.dart';
import 'package:dres/core/services/rate_app_service.dart';
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
        'authenticity': styleDetails?.authenticity,
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

  static const String _firstPublishKey = 'has_shown_first_publish_dialog';

  Future<void> _showFirstPublishDialogIfNeeded() async {
    final prefs = await SharedPreferences.getInstance();
    final hasShown = prefs.getBool(_firstPublishKey) ?? false;

    if (!hasShown && mounted) {
      await prefs.setBool(_firstPublishKey, true);
      if (!mounted) return;

      // Trigger rate app review for first publish milestone
      getIt<RateAppService>().requestReview();

      showDialog(
        context: context,
        builder: (dialogContext) => AlertDialog(
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
          backgroundColor: AppColors.surface,
          title: Row(
            children: [
              PhosphorIcon(
                PhosphorIcons.confetti(PhosphorIconsStyle.fill),
                color: AppColors.success,
                size: 24,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Listing Published!',
                  style: AppTypography.titleLM.copyWith(color: AppColors.textPrimary),
                ),
              ),
            ],
          ),
          content: Text(
            'Your product is now live and visible to buyers. You can find all your published products in the Products tab under your profile.',
            style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(
                'Got it',
                style: AppTypography.bodyM.copyWith(color: AppColors.primary),
              ),
            ),
          ],
        ),
      );
    }
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
        listenWhen: (previous, current) => previous.status != current.status,
        listener: (context, state) {
          if (state.status == StyleDetailsStatus.publishSuccess) {
            AppSnackbar.success(context, 'Listing published successfully');
            getIt<SellBloc>().add(const SellRefreshRequested());
            getIt<UserProductsBloc>().add(const UserProductsRefreshRequested());
            // Show first publish dialog if this is user's first time
            _showFirstPublishDialogIfNeeded();
            // Reload to show updated status
            _loadData();
          }
          if (state.status == StyleDetailsStatus.unpublishSuccess) {
            AppSnackbar.success(context, 'Listing unpublished');
            getIt<SellBloc>().add(const SellRefreshRequested());
            getIt<UserProductsBloc>().add(const UserProductsRefreshRequested());
            // Reload to show updated status
            _loadData();
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
                  'authenticity': styleDetails?.authenticity,
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
              // Boost Banner (show for published styles that aren't boosted)
              _buildBoostBanner(styleState),

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

  Widget _buildBoostBanner(StyleDetailsState state) {
    final details = state.styleDetails;

    // Only show for published styles
    if (details == null || !details.isPublished) {
      return const SizedBox.shrink();
    }

    // Show different banner based on boost status
    if (details.isBoosted && details.boostDetails != null) {
      return _buildActiveBoostedBanner(details);
    }

    // Not boosted - show promotion banner
    return GestureDetector(
      onTap: () async {
        final result = await context.push('/sell/style/${widget.styleId}/boost');
        if (result == true) {
          _loadData();
        }
      },
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppColors.primary.withValues(alpha: 0.1),
              AppColors.primary.withValues(alpha: 0.05),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: PhosphorIcon(
                  PhosphorIcons.rocketLaunch(PhosphorIconsStyle.fill),
                  size: 20,
                  color: AppColors.primary,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Boost your listing',
                    style: AppTypography.bodyM.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Get more visibility and sell faster',
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            PhosphorIcon(
              PhosphorIcons.caretRight(),
              size: 20,
              color: AppColors.primary,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveBoostedBanner(dynamic details) {
    final boostDetails = details.boostDetails;
    final tierName = boostDetails?.tierName ?? 'Boosted';
    final daysRemaining = boostDetails?.daysRemaining ?? 0;
    final hasAnalytics = boostDetails?.hasAnalytics ?? false;
    final isExpiringSoon = boostDetails?.isExpiringSoon ?? false;

    return GestureDetector(
      onTap: hasAnalytics
          ? () {
              context.push(
                '/sell/style/${widget.styleId}/stats',
                extra: {'styleTitle': details.title},
              );
            }
          : null,
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppColors.success.withValues(alpha: 0.1),
              AppColors.success.withValues(alpha: 0.05),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(
            color: isExpiringSoon
                ? AppColors.warning.withValues(alpha: 0.5)
                : AppColors.success.withValues(alpha: 0.3),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: PhosphorIcon(
                  PhosphorIcons.rocketLaunch(PhosphorIconsStyle.fill),
                  size: 20,
                  color: AppColors.success,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tierName,
                    style: AppTypography.bodyM.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    isExpiringSoon
                        ? '$daysRemaining day${daysRemaining != 1 ? 's' : ''} remaining'
                        : '$daysRemaining days remaining',
                    style: AppTypography.bodyS.copyWith(
                      color: isExpiringSoon
                          ? AppColors.warning
                          : AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            if (hasAnalytics) ...[
              Text(
                'View Analytics',
                style: AppTypography.bodyS.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.success,
                ),
              ),
              const SizedBox(width: 4),
              PhosphorIcon(
                PhosphorIcons.caretRight(),
                size: 20,
                color: AppColors.success,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildProductDetailsSection(StyleDetailsState state) {
    final details = state.styleDetails;
    final isComplete = details != null &&
        details.title != null &&
        details.title!.isNotEmpty &&
        details.categoryId != null;

    return GestureDetector(
      onTap: _onEditProductDetails,
      child: Container(
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
                          ? AppColors.success.withValues(alpha: 0.1)
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
                  PhosphorIcon(
                    PhosphorIconsRegular.caretRight,
                    size: 16,
                    color: AppColors.textSecondary,
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

  /// Check if style details are complete (title, category, brand)
  bool _isStyleDetailsComplete(StyleDetailsState styleState) {
    final details = styleState.styleDetails;
    return details != null &&
        details.title != null &&
        details.title!.trim().isNotEmpty &&
        details.categoryId != null &&
        details.brandId != null;
  }

  Widget _buildVariationsSection() {
    return BlocBuilder<StyleDetailsBloc, StyleDetailsState>(
      builder: (context, styleState) {
        // Check if style details are complete before allowing variations
        final canAddVariation = _isStyleDetailsComplete(styleState);

        return BlocBuilder<VariationsBloc, VariationsState>(
          builder: (context, state) {
            final isLoading = state.status == VariationsStatus.loading;
            final isCreating = state.status == VariationsStatus.creating;
            final variations = state.variations;

            // Check if at least one variation is complete
            final hasCompleteVariation = variations.any((v) =>
                v.images.length >= 3 &&
                v.variants.isNotEmpty &&
                v.skus.isNotEmpty);

            // Check if any variation has image issues (flagged or rejected)
            final hasImageIssues = variations.any((v) => v.hasImageIssues);

            // Can only add variation if style details are complete and not creating
            final canAdd = canAddVariation && !isCreating;

            // Determine section border color: red if issues, green if complete, default otherwise
            Color sectionBorderColor;
            if (hasImageIssues) {
              sectionBorderColor = AppColors.error;
            } else if (hasCompleteVariation) {
              sectionBorderColor = AppColors.success;
            } else {
              sectionBorderColor = AppColors.border;
            }

            return Container(
              margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: Border.all(
                  color: sectionBorderColor,
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
                            color: hasImageIssues
                                ? AppColors.error.withValues(alpha: 0.1)
                                : hasCompleteVariation
                                    ? AppColors.success.withValues(alpha: 0.1)
                                    : AppColors.background,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: hasImageIssues
                                  ? AppColors.error
                                  : hasCompleteVariation
                                      ? AppColors.success
                                      : AppColors.border,
                            ),
                          ),
                          child: Center(
                            child: hasImageIssues
                                ? Icon(
                                    PhosphorIcons.x(PhosphorIconsStyle.bold),
                                    color: AppColors.error,
                                    size: 16,
                                  )
                                : hasCompleteVariation
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
                        child: CircularProgressIndicator(
                            color: AppColors.textPrimary),
                      ),
                    )
                  else if (variations.isEmpty)
                    _buildEmptyVariations(canAddVariation)
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
                        onTap: canAdd ? _onAddVariation : null,
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
                                  color: canAdd
                                      ? AppColors.textPrimary
                                      : AppColors.textHint,
                                ),
                              const SizedBox(width: 8),
                              Text(
                                'Add Variation',
                                style: AppTypography.bodyM.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: canAdd
                                      ? AppColors.textPrimary
                                      : AppColors.textHint,
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
      },
    );
  }

  Widget _buildEmptyVariations(bool canAddVariation) {
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
              canAddVariation
                  ? 'Add color variations of your product'
                  : 'Complete product details first',
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
                    fit: BoxFit.contain,
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
    // Image issues take priority - show error state
    if (variation.hasImageIssues) {
      return VariationStatus.imageIssues;
    }
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
      case VariationStatus.imageIssues:
        return AppColors.error;
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
      case VariationStatus.imageIssues:
        return PhosphorIcons.xCircle(PhosphorIconsStyle.fill);
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
      case VariationStatus.imageIssues:
        return 'Images rejected';
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
                    text: isPublished ? 'Unpublish Listing' : 'Publish',
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
  imageIssues, // Images flagged or rejected
}
