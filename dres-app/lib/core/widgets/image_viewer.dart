import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

class ImageViewer extends StatelessWidget {
  final String imageUrl;

  const ImageViewer({
    super.key,
    required this.imageUrl,
  });

  static void show(BuildContext context, String imageUrl) {
    Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (context) => ImageViewer(imageUrl: imageUrl),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.textPrimary,
      appBar: AppBar(
        backgroundColor: AppColors.textPrimary,
        leading: IconButton(
          icon: PhosphorIcon(
            PhosphorIconsRegular.x,
            color: AppColors.surface,
            size: 24,
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Center(
        child: InteractiveViewer(
          minScale: 0.5,
          maxScale: 4.0,
          child: Image.network(
            imageUrl,
            fit: BoxFit.cover,
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return Center(
                child: CircularProgressIndicator(
                  value: loadingProgress.expectedTotalBytes != null
                      ? loadingProgress.cumulativeBytesLoaded /
                          loadingProgress.expectedTotalBytes!
                      : null,
                  color: AppColors.surface,
                ),
              );
            },
            errorBuilder: (context, error, stackTrace) {
              return Center(
                child: PhosphorIcon(
                  PhosphorIconsRegular.imageBroken,
                  color: AppColors.surface,
                  size: 48,
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
