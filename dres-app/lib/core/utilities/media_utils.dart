import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:dres/core/models/block_model.dart';

/// Utility functions for working with media/images
class MediaUtils {
  MediaUtils._();

  /// Get the base URL for the server
  static String get baseUrl =>
      dotenv.env['NEXT_PUBLIC_SERVER_URL'] ?? 'http://localhost:3000';

  /// Get full image URL with base URL
  /// [image] - MediaModel from API
  /// [size] - Preferred size: 'thumbnail', 'square', 'small', 'medium', 'large'
  static String? getImageUrl(MediaModel? image, {String size = 'medium'}) {
    if (image == null) return null;

    // Get URL for requested size, fallback to original
    final imageUrl = image.getUrl(size: size) ?? image.url;
    if (imageUrl == null) return null;

    return resolveUrl(imageUrl);
  }

  /// Resolve a relative URL to absolute
  static String? resolveUrl(String? url) {
    if (url == null) return null;

    // If already absolute URL, return as is
    if (url.startsWith('http')) return url;

    // Prepend base URL
    return '$baseUrl$url';
  }

  /// Get thumbnail URL (300px)
  static String? getThumbnailUrl(MediaModel? image) =>
      getImageUrl(image, size: 'thumbnail');

  /// Get square URL (500px)
  static String? getSquareUrl(MediaModel? image) =>
      getImageUrl(image, size: 'square');

  /// Get small URL (600px)
  static String? getSmallUrl(MediaModel? image) =>
      getImageUrl(image, size: 'small');

  /// Get medium URL (900px)
  static String? getMediumUrl(MediaModel? image) =>
      getImageUrl(image, size: 'medium');

  /// Get large URL (1400px)
  static String? getLargeUrl(MediaModel? image) =>
      getImageUrl(image, size: 'large');
}
