import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/features/sell/data/models/draft_style_model.dart';

class DraftStyleItem extends StatelessWidget {
  final DraftStyleModel draft;
  final VoidCallback? onTap;

  const DraftStyleItem({super.key, required this.draft, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: const BoxDecoration(
          color: AppColors.background,
          border: Border(
            bottom: BorderSide(color: AppColors.secondary, width: 1),
          ),
        ),
        child: Row(
          children: [
            // Thumbnail
            _buildThumbnail(),
            const SizedBox(width: 16),
            // Details
            Expanded(child: _buildDetails()),
            // Chevron right
            PhosphorIcon(
              PhosphorIcons.caretRight(),
              color: AppColors.textPrimary,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildThumbnail() {
    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        color: AppColors.secondary,
        borderRadius: BorderRadius.circular(4),
      ),
      clipBehavior: Clip.antiAlias,
      child: draft.thumbnail != null
          ? CachedNetworkImage(
              imageUrl: draft.thumbnail!,
              fit: BoxFit.cover,
              placeholder: (context, url) => const Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.textHint,
                  ),
                ),
              ),
              errorWidget: (context, url, error) => PhosphorIcon(
                PhosphorIcons.image(),
                color: AppColors.textHint,
                size: 24,
              ),
            )
          : PhosphorIcon(
              PhosphorIcons.image(),
              color: AppColors.textHint,
              size: 24,
            ),
    );
  }

  Widget _buildDetails() {
    final hasTitle = draft.title.isNotEmpty;
    final hasBrand = draft.brandName != null && draft.brandName!.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Brand name (show "No brand" if empty and no title either)
        if (hasBrand) ...[
          Text(
            draft.brandName!.toUpperCase(),
            style: const TextStyle(
              fontFamily: 'HelveticaNowText',
              fontSize: 16,
              fontWeight: FontWeight.w700,
              height: 1.5,
              color: AppColors.textPrimary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ] else if (!hasTitle) ...[
          Text(
            'NO BRAND',
            style: TextStyle(
              fontFamily: 'HelveticaNowText',
              fontSize: 16,
              fontWeight: FontWeight.w700,
              height: 1.5,
              color: AppColors.textHint,
              fontStyle: FontStyle.italic,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
        // Product title
        Text(
          (draft.title.isEmpty ? 'Unknown title' : draft.title).toUpperCase(),
          style: TextStyle(
            fontFamily: 'HelveticaNowText',
            fontSize: 14,
            fontWeight: FontWeight.w400,
            height: 1.5,
            color: draft.title.isEmpty
                ? AppColors.textHint
                : AppColors.textPrimary,
            fontStyle: draft.title.isEmpty
                ? FontStyle.italic
                : FontStyle.normal,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        // Steps left
        Text(
          '${draft.stepsLeft} ${draft.stepsLeft == 1 ? 'step' : 'steps'} left',
          style: const TextStyle(
            fontFamily: 'HelveticaNowText',
            fontSize: 14,
            fontWeight: FontWeight.w400,
            height: 1.5,
            color: Color(0xFFE8A87C), // Peach/orange color from design
          ),
        ),
      ],
    );
  }
}
