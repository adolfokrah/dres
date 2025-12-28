import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

class ShopPromoCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String? imageText;
  final String? badgeImagePath;
  final String? imagePath;
  final List<Color> gradientColors;
  final VoidCallback? onTap;

  const ShopPromoCard({
    super.key,
    required this.title,
    required this.subtitle,
    this.imageText,
    this.badgeImagePath,
    this.imagePath,
    required this.gradientColors,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 88,
        margin: const EdgeInsets.only(bottom: 10),
        child: Row(
          children: [
            // Left side - Text content
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(20),
              color: AppColors.secondary, // #F8F8F8
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title,
                    style: AppTypography.titleLM,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: AppTypography.bodyM,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
          // Right side - Image/Gradient
          Container(
            width: 98,
            height: 88,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              gradient: badgeImagePath == null
                  ? LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: gradientColors,
                      stops: const [0.2216, 0.887],
                    )
                  : null,
              image: imagePath != null && badgeImagePath == null
                  ? DecorationImage(
                      image: AssetImage(imagePath!),
                      fit: BoxFit.cover
                    )
                  : badgeImagePath != null
                      ? DecorationImage(
                          image: AssetImage(badgeImagePath!),
                          fit: BoxFit.cover,
                        )
                      : null,
            ),
            child: Center(
              child: badgeImagePath != null
                  ? null // No overlay widget when badge image is background
                  : imageText != null
                      ? Text(
                          imageText!,
                          style: AppTypography.titleXLM.copyWith(
                            color: Colors.white,
                          ),
                          textAlign: TextAlign.center,
                        )
                      : null,
            ),
          ),
        ],
      ),
      ),
    );
  }
}
