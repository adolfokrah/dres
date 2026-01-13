import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/image_picker_utils.dart';
import 'package:dres/core/utilities/media_utils.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/app_text_area.dart';
import 'package:dres/features/product_details/data/repositories/reviews_repository.dart';
import 'package:dres/features/reviews/logic/create_review_bloc/create_review_bloc.dart';

class CreateReviewScreen extends StatelessWidget {
  final String styleId;
  final String? styleName;
  final String? thumbnailUrl;
  final String? brandName;

  const CreateReviewScreen({
    super.key,
    required this.styleId,
    this.styleName,
    this.thumbnailUrl,
    this.brandName,
  });

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => CreateReviewBloc(
        reviewsRepository: getIt<ReviewsRepository>(),
      ),
      child: _CreateReviewView(
        styleId: styleId,
        initialStyleName: styleName,
        initialThumbnailUrl: thumbnailUrl,
        initialBrandName: brandName,
      ),
    );
  }
}

class _CreateReviewView extends StatefulWidget {
  final String styleId;
  final String? initialStyleName;
  final String? initialThumbnailUrl;
  final String? initialBrandName;

  const _CreateReviewView({
    required this.styleId,
    this.initialStyleName,
    this.initialThumbnailUrl,
    this.initialBrandName,
  });

  @override
  State<_CreateReviewView> createState() => _CreateReviewViewState();
}

class _CreateReviewViewState extends State<_CreateReviewView> {
  final _reviewController = TextEditingController();
  int _hoveredRating = 0;

  // Style info (from props or fetched)
  String? _styleName;
  String? _thumbnailUrl;
  String? _brandName;
  // Seller info
  String? _sellerId;
  String? _sellerName;
  String? _sellerPhotoUrl;
  bool _isLoadingStyleInfo = false;
  String? _styleInfoError;

  @override
  void initState() {
    super.initState();
    _styleName = widget.initialStyleName;
    _thumbnailUrl = widget.initialThumbnailUrl;
    _brandName = widget.initialBrandName;

    // If no style info provided, fetch it (deep link case)
    if (_styleName == null && _thumbnailUrl == null && _brandName == null) {
      _fetchStyleInfo();
    }
  }

  Future<void> _fetchStyleInfo() async {
    setState(() {
      _isLoadingStyleInfo = true;
      _styleInfoError = null;
    });

    try {
      final reviewsRepository = getIt<ReviewsRepository>();
      final styleInfo = await reviewsRepository.getStyleInfo(widget.styleId);
      debugPrint('📦 Style info fetched: $styleInfo');

      if (mounted) {
        // Extract seller info
        final seller = styleInfo['seller'] as Map<String, dynamic>?;

        setState(() {
          _styleName = styleInfo['title'] as String?;
          _thumbnailUrl = MediaUtils.resolveUrl(styleInfo['thumbnailUrl'] as String?);
          _brandName = styleInfo['brandName'] as String?;
          _sellerId = seller?['id'] as String?;
          _sellerName = seller?['shopName'] as String?;
          _sellerPhotoUrl = MediaUtils.resolveUrl(seller?['photoUrl'] as String?);
          _isLoadingStyleInfo = false;
        });
      }
    } catch (e, stackTrace) {
      debugPrint('❌ Error fetching style info: $e');
      debugPrint('📍 Stack trace: $stackTrace');
      if (mounted) {
        setState(() {
          _styleInfoError = 'Failed to load product info';
          _isLoadingStyleInfo = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _reviewController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final bloc = context.read<CreateReviewBloc>();
    final currentImages = bloc.state.images;
    final maxImages = 5 - currentImages.length;

    if (maxImages <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 5 images allowed')),
      );
      return;
    }

    final images = await ImagePickerUtils.pickMultipleImages(
      context,
      maxAssets: maxImages,
      onImageSkipped: (reason) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(reason)),
        );
      },
    );

    if (images.isNotEmpty) {
      bloc.add(CreateReviewImagesChanged(images: [...currentImages, ...images]));
    }
  }

  void _removeImage(int index) {
    final bloc = context.read<CreateReviewBloc>();
    final images = List<File>.from(bloc.state.images);
    images.removeAt(index);
    bloc.add(CreateReviewImagesChanged(images: images));
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<CreateReviewBloc, CreateReviewState>(
      listener: (context, state) {
        if (state.status == CreateReviewStatus.success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Review submitted successfully!'),
              backgroundColor: AppColors.success,
            ),
          );
          context.pop(true); // Return true to indicate success
        } else if (state.status == CreateReviewStatus.failure && state.errorMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.errorMessage!),
              backgroundColor: AppColors.error,
            ),
          );
        }
      },
      builder: (context, state) {
        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            backgroundColor: AppColors.background,
            elevation: 0,
            leading: IconButton(
              icon: PhosphorIcon(PhosphorIconsRegular.x, color: AppColors.textPrimary),
              onPressed: () => context.pop(),
            ),
            title: Text(
              'Write a Review',
              style: AppTypography.titleL.copyWith(color: AppColors.textPrimary),
            ),
            centerTitle: true,
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product Preview
                _buildProductPreview(),

                const SizedBox(height: 12),

                // Seller Info Card
                _buildSellerCard(),

                const SizedBox(height: 32),

                // Rating Section
                Text(
                  'How would you rate this product?',
                  style: AppTypography.bodyM.copyWith(
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: List.generate(5, (index) {
                    final starIndex = index + 1;
                    final isSelected = starIndex <= state.rating;
                    final isHovered = starIndex <= _hoveredRating;

                    return GestureDetector(
                      onTap: () {
                        context.read<CreateReviewBloc>().add(
                          CreateReviewRatingChanged(rating: starIndex),
                        );
                      },
                      child: MouseRegion(
                        onEnter: (_) => setState(() => _hoveredRating = starIndex),
                        onExit: (_) => setState(() => _hoveredRating = 0),
                        child: Padding(
                          padding: const EdgeInsets.only(right: 4),
                          child: PhosphorIcon(
                            isSelected || isHovered
                                ? PhosphorIconsFill.star
                                : PhosphorIconsRegular.star,
                            size: 36,
                            color: isSelected || isHovered
                                ? const Color(0xFFFFC107)
                                : AppColors.border,
                          ),
                        ),
                      ),
                    );
                  }),
                ),
                if (state.rating > 0)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      _getRatingLabel(state.rating),
                      style: AppTypography.bodyS.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),

                const SizedBox(height: 32),

                // Review Text Section
                Text(
                  'Write your review',
                  style: AppTypography.bodyM.copyWith(
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                AppTextArea(
                  controller: _reviewController,
                  hintText: 'Tell others what you think about this product...',
                  maxLines: 5,
                  maxLength: 500,
                  onChanged: (value) {
                    context.read<CreateReviewBloc>().add(
                      CreateReviewTextChanged(text: value),
                    );
                  },
                ),

                const SizedBox(height: 24),

                // Images Section
                Text(
                  'Add photos (optional)',
                  style: AppTypography.bodyM.copyWith(
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      // Add Photo Button
                      if (state.images.length < 5)
                        GestureDetector(
                          onTap: _pickImages,
                          child: Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              border: Border.all(color: AppColors.border, style: BorderStyle.solid),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                PhosphorIcon(
                                  PhosphorIconsRegular.plus,
                                  size: 24,
                                  color: AppColors.textSecondary,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${state.images.length}/5',
                                  style: AppTypography.bodyXS.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                      // Selected Images
                      ...state.images.asMap().entries.map((entry) {
                        final index = entry.key;
                        final image = entry.value;
                        return Padding(
                          padding: const EdgeInsets.only(left: 8),
                          child: Stack(
                            children: [
                              Image.file(
                                image,
                                width: 80,
                                height: 80,
                                fit: BoxFit.cover,
                              ),
                              Positioned(
                                top: 4,
                                right: 4,
                                child: GestureDetector(
                                  onTap: () => _removeImage(index),
                                  child: Container(
                                    width: 24,
                                    height: 24,
                                    decoration: BoxDecoration(
                                      color: AppColors.overlay,
                                      shape: BoxShape.circle,
                                    ),
                                    child: PhosphorIcon(
                                      PhosphorIconsRegular.x,
                                      size: 16,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),

                const SizedBox(height: 40),

                // Submit Button
                AppButton.filled(
                  text: 'Submit Review',
                  isFullWidth: true,
                  isLoading: state.status == CreateReviewStatus.submitting,
                  onPressed: state.status == CreateReviewStatus.submitting
                      ? null
                      : () {
                          context.read<CreateReviewBloc>().add(
                            CreateReviewSubmitted(styleId: widget.styleId),
                          );
                        },
                ),

                const SizedBox(height: 16),

                // Disclaimer
                Center(
                  child: Text(
                    'By submitting, you agree to our review guidelines',
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildProductPreview() {
    if (_isLoadingStyleInfo) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 60,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.secondary,
              ),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (_styleInfoError != null) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 60,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.secondary,
              ),
              child: PhosphorIcon(
                PhosphorIconsRegular.image,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _styleInfoError!,
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.error,
                    ),
                  ),
                  const SizedBox(height: 4),
                  GestureDetector(
                    onTap: _fetchStyleInfo,
                    child: Text(
                      'Tap to retry',
                      style: AppTypography.bodyS.copyWith(
                        color: AppColors.primary,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // No info to show yet and not loading
    if (_styleName == null && _thumbnailUrl == null && _brandName == null) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          if (_thumbnailUrl != null)
            Image.network(
              _thumbnailUrl!,
              width: 60,
              height: 80,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                width: 60,
                height: 80,
                color: AppColors.secondary,
                child: PhosphorIcon(
                  PhosphorIconsRegular.image,
                  color: AppColors.textSecondary,
                ),
              ),
            )
          else
            Container(
              width: 60,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.secondary,
              ),
              child: PhosphorIcon(
                PhosphorIconsRegular.image,
                color: AppColors.textSecondary,
              ),
            ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_brandName != null)
                  Text(
                    _brandName!.toUpperCase(),
                    style: AppTypography.bodyS.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                if (_styleName != null)
                  Text(
                    _styleName!,
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textSecondary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSellerCard() {
    if (_isLoadingStyleInfo || _sellerId == null) {
      return const SizedBox.shrink();
    }

    return GestureDetector(
      onTap: () {
        if (_sellerId != null) {
          context.push('/sellers/$_sellerId');
        }
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            if (_sellerPhotoUrl != null)
              ClipOval(
                child: Image.network(
                  _sellerPhotoUrl!,
                  width: 40,
                  height: 40,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.secondary,
                      shape: BoxShape.circle,
                    ),
                    child: PhosphorIcon(
                      PhosphorIconsRegular.storefront,
                      size: 20,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              )
            else
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.secondary,
                  shape: BoxShape.circle,
                ),
                child: PhosphorIcon(
                  PhosphorIconsRegular.storefront,
                  size: 20,
                  color: AppColors.textSecondary,
                ),
              ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Sold by',
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.textHint,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _sellerName ?? 'Seller',
                    style: AppTypography.bodyM.copyWith(
                      fontWeight: FontWeight.w500,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
            PhosphorIcon(
              PhosphorIconsRegular.caretRight,
              size: 20,
              color: AppColors.textSecondary,
            ),
          ],
        ),
      ),
    );
  }

  String _getRatingLabel(int rating) {
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return '';
    }
  }
}
