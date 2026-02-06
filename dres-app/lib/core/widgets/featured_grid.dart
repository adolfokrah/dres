import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/models/block_model.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/utilities/media_utils.dart';

class FeaturedGrid extends StatelessWidget {
  const FeaturedGrid({
    super.key,
    required this.title,
    required this.items,
    this.columns = 3,
    this.aspectRatio = 1.0,
  });

  final String title;
  final List<FeaturedGridItemModel> items;
  final int columns;
  final double aspectRatio;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title
        if (title.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Text(
              title,
              style: AppTypography.titleL.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w400,
              ),
            ),
          ),

        // Horizontal scroll
        SizedBox(
          height: 200, // Portrait image (150 * 4/3) + label + padding
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final item = items[index];
              return _GridItem(
                item: item,
                imageUrl: MediaUtils.getMediumUrl(item.image),
                width: 140,
                aspectRatio: aspectRatio,
                onTap: item.link != null && item.link!.isNotEmpty
                    ? () => context.push(item.link!)
                    : null,
              );
            },
          ),
        ),
      ],
    );
  }
}

class _GridItem extends StatelessWidget {
  const _GridItem({
    required this.item,
    required this.imageUrl,
    required this.width,
    required this.aspectRatio,
    this.onTap,
  });

  final FeaturedGridItemModel item;
  final String? imageUrl;
  final double width;
  final double aspectRatio;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Image - fixed size, cover to fill uniformly
            Container(
              height: 170,
              width: width,
              clipBehavior: Clip.hardEdge,
              decoration: BoxDecoration(
                color: AppColors.secondary,
              ),
              child: imageUrl != null
                  ? Image.network(
                      imageUrl!,
                      height: 200,
                      width: width,
                      fit: BoxFit.cover,
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return const SizedBox.shrink();
                      },
                      errorBuilder: (_, __, ___) => Center(
                        child: PhosphorIcon(
                          PhosphorIconsRegular.imageSquare,
                          color: AppColors.textHint,
                        ),
                      ),
                    )
                  : Center(
                      child: PhosphorIcon(
                        PhosphorIconsRegular.imageSquare,
                        color: AppColors.textHint,
                      ),
                    ),
            ),
            const SizedBox(height: 8),
            // Label
            Text(
              item.label.toUpperCase(),
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textPrimary,
                letterSpacing: 0.5,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
