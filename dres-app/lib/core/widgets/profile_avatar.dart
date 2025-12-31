import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

/// A reusable circular profile avatar widget.
/// Shows the user's photo if available, otherwise shows their initial.
class ProfileAvatar extends StatelessWidget {
  /// The URL of the profile photo. If null, shows the initial.
  final String? photoUrl;

  /// The display name used to extract the initial when no photo is available.
  final String displayName;

  /// The size (width and height) of the avatar.
  final double size;

  /// The font size of the initial letter. Defaults to size * 0.35.
  final double? initialFontSize;

  const ProfileAvatar({
    super.key,
    this.photoUrl,
    required this.displayName,
    this.size = 75,
    this.initialFontSize,
  });

  @override
  Widget build(BuildContext context) {
    final fontSize = initialFontSize ?? size * 0.35;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.secondary,
        image: photoUrl != null
            ? DecorationImage(
                image: NetworkImage(photoUrl!),
                fit: BoxFit.cover,
              )
            : null,
      ),
      child: photoUrl == null
          ? Center(
              child: Text(
                displayName.isNotEmpty ? displayName[0].toUpperCase() : '?',
                style: AppTypography.titleL.copyWith(
                  color: AppColors.textSecondary,
                  fontSize: fontSize,
                ),
              ),
            )
          : null,
    );
  }
}
