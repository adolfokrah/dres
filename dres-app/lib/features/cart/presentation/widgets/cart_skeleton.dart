import 'package:flutter/material.dart';
import 'package:dres/core/widgets/skeleton_loader.dart';
import 'package:dres/core/theme/app_colors.dart';

/// Skeleton loader for cart items while cart is loading
class CartSkeleton extends StatelessWidget {
  const CartSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: 2, // Show 2 skeleton seller groups
      separatorBuilder: (_, _) => const SizedBox(height: 24),
      itemBuilder: (context, index) {
        return _SellerGroupSkeleton();
      },
    );
  }
}

class _SellerGroupSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Seller header skeleton
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Seller avatar
                SkeletonLoader(
                  width: 32,
                  height: 32,
                  borderRadius: BorderRadius.circular(16),
                ),
                const SizedBox(width: 12),
                // Seller name
                const SkeletonLoader(
                  width: 120,
                  height: 16,
                  borderRadius: BorderRadius.all(Radius.circular(4)),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          // Cart items skeleton
          _CartItemSkeleton(),
          _CartItemSkeleton(),
        ],
      ),
    );
  }
}

class _CartItemSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: AppColors.background,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Item thumbnail
          SkeletonLoader(
            width: 80,
            height: 80,
            borderRadius: BorderRadius.circular(4),
          ),
          const SizedBox(width: 12),
          // Item details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                const SkeletonLoader(
                  width: double.infinity,
                  height: 16,
                  borderRadius: BorderRadius.all(Radius.circular(4)),
                ),
                const SizedBox(height: 8),
                // Subtitle
                const SkeletonLoader(
                  width: 150,
                  height: 14,
                  borderRadius: BorderRadius.all(Radius.circular(4)),
                ),
                const SizedBox(height: 12),
                // Price and quantity
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const SkeletonLoader(
                      width: 60,
                      height: 18,
                      borderRadius: BorderRadius.all(Radius.circular(4)),
                    ),
                    SkeletonLoader(
                      width: 80,
                      height: 32,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
