import 'package:flutter/material.dart';

/// App color palette (Light theme only)
class AppColors {
  AppColors._();

  // Primary colors
  static const Color primary = Color(0xFF000000);
  static const Color primaryLight = Color(0xFF333333);

  // Secondary colors
  static const Color secondary = Color(0xFFF8F8F8);

  // Background colors
  static const Color background = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFFFFFFF);

  // Text colors
  static const Color textPrimary = Color(0xFF000000);
  static const Color textSecondary = Color(0xFF666666);
  static const Color textHint = Color(0xFF999999);
  static const Color textOnPrimary = Color(0xFFFFFFFF);

  // App status colors (deeper/darker for UI feedback)
  static const Color success = Color(0xFF2E7D32);  // Deep green
  static const Color error = Color(0xFFD32F2F);    // Deep red
  static const Color warning = Color(0xFFED6C02);  // Deep orange
  static const Color info = Color(0xFF0288D1);     // Deep blue

  // Promo banner colors (light/pastel - matching web)
  static const Color promoSuccess = Color(0xFFACF8BF);  // Light mint green
  static const Color promoError = Color(0xFFF8ACAC);    // Light red/pink
  static const Color promoWarning = Color(0xFFF4D39D);  // Light orange/peach
  static const Color promoInfo = Color(0xFF9DE5F4);     // Light blue

  // Gray
  static const Color gray = Color(0xFFE3E3E3);

  // Border colors
  static const Color border = Color(0xFFE0E0E0);
  static const Color divider = Color(0xFFEEEEEE);

  // Other
  static const Color shadow = Color(0x1A000000);
  static const Color overlay = Color(0x80000000);
  static const Color disabled = Color(0xFFBDBDBD);
}
