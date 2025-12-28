import 'package:flutter/material.dart';
import 'package:dres/core/widgets/skeleton_loader.dart';

class ProductCardSkeleton extends StatelessWidget {
  const ProductCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Image skeleton
        AspectRatio(
          aspectRatio: 0.75,
          child: SkeletonLoader(
            borderRadius: BorderRadius.zero,
          ),
        ),
        const SizedBox(height: 8),
        
        // Brand skeleton
        SkeletonLoader(
          width: 80,
          height: 12,
        ),
        const SizedBox(height: 6),
        
        // Title skeleton
        SkeletonLoader(
          width: double.infinity,
          height: 14,
        ),
        const SizedBox(height: 4),
        
        // Title line 2
        SkeletonLoader(
          width: 120,
          height: 14,
        ),
        const SizedBox(height: 8),
        
        // Price skeleton
        SkeletonLoader(
          width: 60,
          height: 16,
        ),
      ],
    );
  }
}
