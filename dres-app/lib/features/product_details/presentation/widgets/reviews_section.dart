import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/features/product_details/presentation/widgets/review_item.dart';
import 'package:dres/l10n/app_localizations.dart';

class ReviewsSection extends StatelessWidget {
  final int totalReviews;
  final List<ReviewItemData> reviews;

  const ReviewsSection({
    super.key,
    required this.totalReviews,
    required this.reviews,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Column(
      children: [
        // Reviews header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          height: 33,
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'Reviews ($totalReviews)',
              style: AppTypography.titleXL.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ),
        
        // Review items
        ...reviews.map((review) => ReviewItem(
          reviewerName: review.reviewerName,
          reviewerImage: review.reviewerImage,
          review: review.review,
          images: review.images,
        )),
      ],
    );
  }
}

class ReviewItemData {
  final String reviewerName;
  final String? reviewerImage;
  final String review;
  final List<String> images;

  ReviewItemData({
    required this.reviewerName,
    this.reviewerImage,
    required this.review,
    this.images = const [],
  });
}
