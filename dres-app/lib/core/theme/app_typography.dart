import 'package:flutter/material.dart';

/// App typography based on design system
/// - AlbraSerif: Headlines, titles, display text
/// - HelveticaNow: Body text, UI elements
class AppTypography {
  AppTypography._();

  // Font families
  static const String fontFamilySerif = 'AlbraSerif';
  static const String fontFamilySans = 'HelveticaNow';

  // ========================
  // Title Styles (AlbraSerif)
  // ========================

  /// Title XL - 24/Auto
  static const TextStyle titleXL = TextStyle(
    fontFamily: fontFamilySerif,
    fontSize: 24,
    fontWeight: FontWeight.w600,
    height: 1.2,
  );

  /// Title L - 24/Auto
  static const TextStyle titleL = TextStyle(
    fontFamily: fontFamilySerif,
    fontSize: 24,
    fontWeight: FontWeight.w600,
    height: 1.2,
  );

  /// Title XL Medium - 24/Auto
  static const TextStyle titleXLM = TextStyle(
    fontFamily: fontFamilySerif,
    fontSize: 24,
    fontWeight: FontWeight.w500,
    height: 1.2,
  );

  /// Title L Medium - 24/Auto
  static const TextStyle titleLM = TextStyle(
    fontFamily: fontFamilySerif,
    fontSize: 24,
    fontWeight: FontWeight.w500,
    height: 1.2,
  );

  // ========================
  // Body Styles (HelveticaNow)
  // ========================

  /// Body M - 14/Auto
  static const TextStyle bodyM = TextStyle(
    fontFamily: fontFamilySans,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.4,
  );

  /// Body L - 16/Auto
  static const TextStyle bodyL = TextStyle(
    fontFamily: fontFamilySans,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.4,
  );

  /// Body XS - 7/Auto (caption/small text)
  static const TextStyle bodyXS = TextStyle(
    fontFamily: fontFamilySans,
    fontSize: 7,
    fontWeight: FontWeight.w400,
    height: 1.4,
  );

  /// Body S - 10/Auto
  static const TextStyle bodyS = TextStyle(
    fontFamily: fontFamilySans,
    fontSize: 10,
    fontWeight: FontWeight.w400,
    height: 1.4,
  );

  // ========================
  // Additional Utility Styles
  // ========================

  /// Button text
  static const TextStyle button = TextStyle(
    fontFamily: fontFamilySans,
    fontSize: 14,
    fontWeight: FontWeight.w700,
    height: 1.2,
    letterSpacing: 0.5,
  );

  /// Caption text
  static const TextStyle caption = TextStyle(
    fontFamily: fontFamilySans,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.4,
  );

  /// Overline text
  static const TextStyle overline = TextStyle(
    fontFamily: fontFamilySans,
    fontSize: 10,
    fontWeight: FontWeight.w700,
    height: 1.4,
    letterSpacing: 1.5,
  );
}
