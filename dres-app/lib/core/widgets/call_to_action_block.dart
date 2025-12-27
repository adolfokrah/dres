import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../utilities/media_utils.dart';

class CallToActionBlock extends StatelessWidget {
  final String? imageUrl;
  final String title;
  final String buttonText;
  final String buttonLink;

  const CallToActionBlock({
    super.key,
    this.imageUrl,
    required this.title,
    required this.buttonText,
    required this.buttonLink,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black,
      ),
      child: Row(
        children: [
          // Left: Image
          if (imageUrl != null)
            Container(
              width: 128,
              height: 172,
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: NetworkImage(
                    MediaUtils.resolveUrl(imageUrl) ?? '',
                  ),
                  fit: BoxFit.cover,
                ),
              ),
            ),
          
          // Right: Content with Black Background
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 18,
                vertical: 32,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    title,
                    style: AppTypography.titleXL.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w400,
                      fontSize: 34
                    ),
                  ),
                  const SizedBox(height: 14),
                  
                  // Button
                  GestureDetector(
                    onTap: () {
                      // TODO: Handle button tap navigation
                      // Navigator.pushNamed(context, buttonLink);
                    },
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          buttonText,
                          style: AppTypography.bodyL.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 19
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(
                          Icons.arrow_forward,
                          color: Colors.white,
                          size: 16,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
