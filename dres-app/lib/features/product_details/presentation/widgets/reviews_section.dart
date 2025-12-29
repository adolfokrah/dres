import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/features/product_details/presentation/widgets/review_item.dart';
import 'package:dres/features/product_details/data/repositories/reviews_repository.dart';
import 'package:dres/features/product_details/data/models/reviews_model.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/l10n/app_localizations.dart';

class ReviewsSection extends StatefulWidget {
  final String styleId;

  const ReviewsSection({
    super.key,
    required this.styleId,
  });

  @override
  State<ReviewsSection> createState() => _ReviewsSectionState();
}

class _ReviewsSectionState extends State<ReviewsSection> {
  late final ReviewsRepository _reviewsRepository;
  late Future<ReviewsModel> _reviewsFuture;
  int _currentPage = 1;
  final int _limit = 10;

  @override
  void initState() {
    super.initState();
    _reviewsRepository = getIt<ReviewsRepository>();
    _loadReviews();
  }

  void _loadReviews() {
    setState(() {
      _reviewsFuture = _reviewsRepository.getStyleReviews(
        styleId: widget.styleId,
        page: _currentPage,
        limit: _limit,
      );
    });
  }

  void _loadMoreReviews() {
    setState(() {
      _currentPage++;
      _loadReviews();
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return FutureBuilder<ReviewsModel>(
      future: _reviewsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: CircularProgressIndicator(),
            ),
          );
        }

        if (snapshot.hasError) {
          return Padding(
            padding: const EdgeInsets.all(20),
            child: Text(
              'Error loading reviews: ${snapshot.error}',
              style: AppTypography.bodyS.copyWith(
                color: AppColors.error,
              ),
            ),
          );
        }

        if (!snapshot.hasData || snapshot.data!.reviews.isEmpty) {
          return const SizedBox.shrink();
        }

        final reviewsData = snapshot.data!;

        return Column(
          children: [
            // Reviews header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              height: 33,
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Reviews (${reviewsData.totalReviews})',
                  style: AppTypography.titleXL.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ),
            
            // Review items
            ...reviewsData.reviews.map((review) => ReviewItem(
              reviewerName: review.reviewer.name,
              reviewerImage: review.reviewer.profileImage,
              review: review.review,
              images: review.images,
            )),

            // Load more button (if there are more reviews)
            if (reviewsData.reviews.length >= _limit &&
                reviewsData.reviews.length < reviewsData.totalReviews)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                child: TextButton(
                  onPressed: _loadMoreReviews,
                  child: Text(
                    'Load more reviews',
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textPrimary,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}