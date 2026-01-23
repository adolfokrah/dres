import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/media_utils.dart';
import 'package:dres/core/widgets/image_viewer.dart';

class ReviewItem extends StatelessWidget {
  final String reviewerName;
  final String? reviewerImage;
  final String review;
  final List<String> images;

  const ReviewItem({
    super.key,
    required this.reviewerName,
    this.reviewerImage,
    required this.review,
    this.images = const [],
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Reviewer profile image
          Container(
            width: 30,
            height: 32,
            decoration: BoxDecoration(
              color: const Color(0xFFD9D9D9),
              image: reviewerImage != null
                  ? DecorationImage(
                      image: NetworkImage(
                        MediaUtils.resolveUrl(reviewerImage) ?? '',
                      ),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
          ),
          const SizedBox(width: 8),
          
          // Review content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Reviewer name
                Text(
                  reviewerName,
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w700
                  ),
                ),
                const SizedBox(height: 2),
                
                // Review text
                Text(
                  review,
                  style: AppTypography.bodyM.copyWith(
                    color: const Color(0xFF4E4E4E),
                  ),
                ),
                
                // Review images
                if (images.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: images.take(2).map((imageUrl) {
                      final fullUrl = MediaUtils.resolveUrl(imageUrl) ?? '';
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () {
                            ImageViewer.show(context, fullUrl);
                          },
                          child: Container(
                            width: 40,
                            height: 45,
                            decoration: BoxDecoration(
                              image: DecorationImage(
                                image: NetworkImage(fullUrl),
                                fit: BoxFit.contain,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
