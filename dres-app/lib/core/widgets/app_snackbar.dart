import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';

/// A utility class for showing consistent snackbars throughout the app.
///
/// Usage:
/// ```dart
/// AppSnackbar.success(context, 'Item saved successfully');
/// AppSnackbar.error(context, 'Failed to save item');
/// ```
class AppSnackbar {
  AppSnackbar._();

  /// Shows a success snackbar with green background
  static void success(BuildContext context, String message) {
    _show(
      context,
      message: message,
      backgroundColor: AppColors.success,
    );
  }

  /// Shows an error snackbar with red background
  static void error(BuildContext context, String message) {
    _show(
      context,
      message: message,
      backgroundColor: AppColors.error,
    );
  }

  /// Internal method to show snackbar with given configuration
  static void _show(
    BuildContext context, {
    required String message,
    required Color backgroundColor,
    Duration duration = const Duration(seconds: 3),
  }) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: backgroundColor,
        duration: duration,
        behavior: SnackBarBehavior.fixed,
      ),
    );
  }
}
