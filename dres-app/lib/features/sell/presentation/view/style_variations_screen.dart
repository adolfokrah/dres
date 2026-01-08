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
import 'package:dres/features/sell/presentation/widgets/sell_step_indicator.dart';
import 'package:dres/features/sell/logic/variations_bloc/variations_bloc.dart';
import 'package:dres/features/sell/logic/sell_bloc/sell_bloc.dart';
import 'package:dres/features/sell/data/models/variation_model.dart';

class StyleVariationsScreen extends StatefulWidget {
  final String styleId;
  final String? styleTitle;
  final String? categoryId;

  const StyleVariationsScreen({
    super.key,
    required this.styleId,
    this.styleTitle,
    this.categoryId,
  });

  @override
  State<StyleVariationsScreen> createState() => _StyleVariationsScreenState();
}

class _StyleVariationsScreenState extends State<StyleVariationsScreen> {
  late final VariationsBloc _variationsBloc;

  @override
  void initState() {
    super.initState();
    _variationsBloc = getIt<VariationsBloc>();
    _variationsBloc.add(VariationsLoadRequested(styleId: widget.styleId));
  }

  void _onAddVariation() {
    // Create empty variation (no variants required initially)
    _variationsBloc.add(VariationCreateRequested(styleId: widget.styleId));
  }

  void _onVariationTap(VariationModel variation) async {
    await context.push(
      '/sell/style/${widget.styleId}/variation/${variation.id}',
      extra: {
        'variationName': variation.displayName,
        'categoryId': widget.categoryId,
      },
    );
    // Reload variations when returning from variation detail
    _variationsBloc.add(VariationsLoadRequested(styleId: widget.styleId));
  }

  void _onDone() {
    // Refetch drafts
    getIt<SellBloc>().add(const SellRefreshRequested());
    // Navigate to step 3 or back to sell screen
    // For now, just go back
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _variationsBloc,
      child: BlocConsumer<VariationsBloc, VariationsState>(
        listener: (context, state) {
          if (state.status == VariationsStatus.createSuccess) {
            // Navigate to the newly created variation detail screen
            if (state.createdVariationId != null) {
              context.push(
                '/sell/style/${widget.styleId}/variation/${state.createdVariationId}',
                extra: {
                  'variationName': widget.styleTitle ?? 'New Variation',
                  'categoryId': widget.categoryId,
                },
              ).then((_) {
                // Reload variations when returning from variation detail
                _variationsBloc.add(VariationsLoadRequested(styleId: widget.styleId));
              });
            }
          }

          if (state.status == VariationsStatus.deleteSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Variation deleted'),
                backgroundColor: AppColors.success,
              ),
            );
          }

          if (state.status == VariationsStatus.failure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage ?? 'An error occurred'),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        builder: (context, state) {
          final isLoading = state.status == VariationsStatus.loading;
          final isCreating = state.status == VariationsStatus.creating;

          return Scaffold(
            backgroundColor: AppColors.background,
            body: SafeArea(
              child: Column(
                children: [
                  // Header
                  UnifiedHeader.titleOnly(
                    title: widget.styleTitle ?? 'Product Variations',
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

                                // Info banner
                                _buildInfoBanner(),

                                // Variations section
                                _buildVariationsSection(state, isCreating),
                              ],
                            ),
                          ),
                  ),

                  // Bottom button
                  _buildBottomSection(state),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      color: AppColors.secondary,
      child: RichText(
        text: TextSpan(
          style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
          children: const [
            TextSpan(
              text:
                  'Add variations of your product (e.g. different colors or material type).',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            TextSpan(
              text:
                  '\nTap + to create a new variation, then review and edit each one before finishing.',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVariationsSection(VariationsState state, bool isCreating) {
    // Only allow adding variations if style has a title
    final hasTitle = widget.styleTitle?.trim().isNotEmpty ?? false;
    final canAddVariation = hasTitle && !isCreating;

    return Column(
      children: [
        // Header row with "Variations" and "+" button
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
        if (state.variations.isEmpty)
          _buildEmptyVariations()
        else
          ...state.variations.asMap().entries.map((entry) {
            final index = entry.key;
            final variation = entry.value;
            final isLast = index == state.variations.length - 1;
            return _buildVariationItem(variation, isLast);
          }),
      ],
    );
  }

  Widget _buildEmptyVariations() {
    return Container(
      padding: const EdgeInsets.all(40),
      child: Center(
        child: Column(
          children: [
            PhosphorIcon(
              PhosphorIcons.tShirt(),
              size: 48,
              color: AppColors.textHint,
            ),
            const SizedBox(height: 16),
            Text(
              'No variations yet',
              style: AppTypography.bodyM.copyWith(color: AppColors.textHint),
            ),
            const SizedBox(height: 8),
            Text(
              'Tap + to add your first variation',
              style: AppTypography.bodyS.copyWith(color: AppColors.textHint),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVariationItem(VariationModel variation, bool isLast) {
    final images = variation.images;
    final displayImages = images.take(3).toList();
    final remainingCount = images.length > 3 ? images.length - 3 : 0;

    return GestureDetector(
      onTap: () => _onVariationTap(variation),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: AppColors.secondary,
              width: isLast ? 10 : 1,
            ),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    variation.displayName,
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                  if (images.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        ...displayImages.map((imageUrl) => Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: CachedNetworkImage(
                              imageUrl: imageUrl,
                              width: 40,
                              height: 40,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(
                                width: 40,
                                height: 40,
                                color: AppColors.secondary,
                                child: const Center(
                                  child: SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: AppColors.textHint,
                                    ),
                                  ),
                                ),
                              ),
                              errorWidget: (context, url, error) => Container(
                                width: 40,
                                height: 40,
                                color: AppColors.secondary,
                                child: const Icon(
                                  Icons.image,
                                  size: 16,
                                  color: AppColors.textHint,
                                ),
                              ),
                            ),
                          ),
                        )),
                        if (remainingCount > 0)
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: AppColors.secondary,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Center(
                              child: Text(
                                '+$remainingCount',
                                style: AppTypography.bodyS.copyWith(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ],
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

  Widget _buildBottomSection(VariationsState state) {
    final hasVariations = state.variations.isNotEmpty;

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
              onPressed: hasVariations ? _onDone : null,
              variant: hasVariations
                  ? AppButtonVariant.filled
                  : AppButtonVariant.outlined,
            ),
          ),
        ),
      ),
    );
  }
}
