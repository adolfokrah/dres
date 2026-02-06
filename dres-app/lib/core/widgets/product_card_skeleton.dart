import 'package:flutter/material.dart';
import 'package:dres/core/widgets/skeleton_loader.dart';
import 'package:dres/core/theme/app_colors.dart';

class ProductCardSkeleton extends StatelessWidget {
  const ProductCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image skeleton
          AspectRatio(
            aspectRatio: 0.85,
            child: SkeletonLoader(
              borderRadius: BorderRadius.zero,
            ),
          ),

          // Content skeleton
          Expanded(
            child: ClipRect(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Brand skeleton
                    SkeletonLoader(
                      width: 80,
                      height: 12,
                    ),
                    const SizedBox(height: 4),

                    // Category skeleton
                    SkeletonLoader(
                      width: 60,
                      height: 12,
                    ),
                    const SizedBox(height: 2),

                    // Title skeleton
                    SkeletonLoader(
                      width: double.infinity,
                      height: 12,
                    ),
                    const SizedBox(height: 4),

                    // Price skeleton
                    SkeletonLoader(
                      width: 70,
                      height: 14,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
