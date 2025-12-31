import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

/// Result from the image picker
class ImagePickerResult {
  final File file;
  final String path;

  ImagePickerResult({required this.file, required this.path});
}

/// A reusable image picker widget that shows selected image with tap to change
class AppImagePicker extends StatelessWidget {
  final File? selectedImage;
  final VoidCallback onTap;
  final double? width;
  final double? height;
  final String? placeholder;
  final BorderRadius? borderRadius;

  const AppImagePicker({
    super.key,
    this.selectedImage,
    required this.onTap,
    this.width,
    this.height,
    this.placeholder,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: selectedImage != null
          ? ClipRRect(
              borderRadius: borderRadius ?? BorderRadius.circular(8),
              child: Image.file(
                selectedImage!,
                width: width ?? 195,
                height: height ?? 260,
                fit: BoxFit.cover,
              ),
            )
          : Container(
              width: width ?? 195,
              height: height ?? 260,
              decoration: BoxDecoration(
                color: AppColors.secondary,
                borderRadius: borderRadius ?? BorderRadius.circular(8),
                border: Border.all(
                  color: AppColors.textSecondary.withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    PhosphorIcons.camera(),
                    size: 40,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    placeholder ?? 'Tap to add image',
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
    );
  }

  /// Show the image picker bottom sheet and return selected image
  static Future<ImagePickerResult?> showPicker(
    BuildContext context, {
    double maxWidth = 1024,
    double maxHeight = 1024,
    int imageQuality = 80,
  }) async {
    return showModalBottomSheet<ImagePickerResult>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => _ImagePickerBottomSheet(
        maxWidth: maxWidth,
        maxHeight: maxHeight,
        imageQuality: imageQuality,
      ),
    );
  }
}

class _ImagePickerBottomSheet extends StatelessWidget {
  final double maxWidth;
  final double maxHeight;
  final int imageQuality;

  const _ImagePickerBottomSheet({
    required this.maxWidth,
    required this.maxHeight,
    required this.imageQuality,
  });

  Future<void> _pickImage(BuildContext context, ImageSource source) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: source,
      maxWidth: maxWidth,
      maxHeight: maxHeight,
      imageQuality: imageQuality,
    );

    if (pickedFile != null && context.mounted) {
      Navigator.of(context).pop(
        ImagePickerResult(
          file: File(pickedFile.path),
          path: pickedFile.path,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.textSecondary.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            
            // Title
            Text(
              'Select photos',
              style: AppTypography.bodyL.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 24),

            // Options
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  // Take photo option
                  Expanded(
                    child: _PickerOption(
                      icon: PhosphorIcons.camera(),
                      label: 'Take photo',
                      onTap: () => _pickImage(context, ImageSource.camera),
                    ),
                  ),
                  const SizedBox(width: 16),
                  // Choose from gallery option
                  Expanded(
                    child: _PickerOption(
                      icon: PhosphorIcons.images(),
                      label: 'Choose from gallery',
                      onTap: () => _pickImage(context, ImageSource.gallery),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Cancel button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text(
                    'Cancel',
                    style: AppTypography.bodyL.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class _PickerOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _PickerOption({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          color: AppColors.secondary,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 32,
              color: AppColors.textPrimary,
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
