import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:wechat_assets_picker/wechat_assets_picker.dart';
import 'package:wechat_camera_picker/wechat_camera_picker.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path/path.dart' as path;
import 'package:dres/core/theme/app_colors.dart';

/// Utility class for picking images using wechat_assets_picker
class ImagePickerUtils {
  ImagePickerUtils._();

  /// Minimum image dimension required (width or height)
  static const int minImageDimension = 500;

  /// Supported image formats for upload
  static const List<String> supportedFormats = ['png', 'jpeg', 'jpg'];

  /// Validate image format
  /// Returns null if valid, or error message if invalid
  static String? _validateImageFormat(String filePath) {
    final extension = path.extension(filePath).toLowerCase().replaceAll('.', '');

    if (!supportedFormats.contains(extension)) {
      return 'Unsupported image format (.$extension). Please use PNG or JPEG images.';
    }

    return null; // Valid
  }

  /// Validate image dimensions
  /// Returns null if valid, or error message if invalid
  static Future<String?> _validateImageDimensions(File file) async {
    try {
      final bytes = await file.readAsBytes();
      final codec = await ui.instantiateImageCodec(bytes);
      final frame = await codec.getNextFrame();
      final image = frame.image;
      
      final width = image.width;
      final height = image.height;
      
      print('📐 Image dimensions: ${width}x$height');
      
      // Require BOTH dimensions to be at least minImageDimension
      if (width < minImageDimension || height < minImageDimension) {
        return 'Image is too small (${width}x$height). Both dimensions must be at least ${minImageDimension} pixels.';
      }
      
      return null; // Valid
    } catch (e) {
      print('❌ Failed to validate image dimensions: $e');
      return null; // Allow if we can't validate
    }
  }

  /// Compress image to reduce file size
  static Future<File?> _compressImage(File file) async {
    try {
      final originalSize = await file.length();
      print('📂 Original file size: ${(originalSize / 1024 / 1024).toStringAsFixed(2)} MB');
      
      // Create compressed file path
      final dir = path.dirname(file.path);
      final name = path.basenameWithoutExtension(file.path);
      final ext = path.extension(file.path);
      final compressedPath = '$dir/${name}_compressed$ext';
      
      // Compress the image
      final compressedFile = await FlutterImageCompress.compressAndGetFile(
        file.absolute.path,
        compressedPath,
        quality: 70, // 70% quality - good balance of size/quality
        minWidth: 1920, // Max width 1920px
        minHeight: 1920, // Max height 1920px
        format: CompressFormat.jpeg, // Always convert to JPEG
      );
      
      if (compressedFile != null) {
        final compressedSize = await compressedFile.length();
        print('📂 Compressed file size: ${(compressedSize / 1024 / 1024).toStringAsFixed(2)} MB');
        print('📉 Compression ratio: ${((originalSize - compressedSize) / originalSize * 100).toStringAsFixed(1)}%');
        // Convert XFile to File
        return File(compressedFile.path);
      }
    } catch (e) {
      print('❌ Compression failed: $e');
    }
    return file; // Return original if compression fails
  }

  /// Get theme for the picker - using dark theme for better visibility
  static ThemeData get _pickerTheme => ThemeData.dark().copyWith(
        primaryColor: AppColors.textPrimary,
        colorScheme: ColorScheme.dark(
          primary: AppColors.textPrimary,
          secondary: AppColors.textPrimary,
          surface: Colors.grey[900]!,
          onPrimary: Colors.white,
          onSecondary: Colors.white,
          onSurface: Colors.white,
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: Colors.grey[900],
          foregroundColor: Colors.white,
          elevation: 0,
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: Colors.white,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      );

  /// Pick a single image from gallery or camera
  /// Returns the selected File or null if cancelled
  static Future<File?> pickSingleImage(BuildContext context, {bool compress = true}) async {
    final List<AssetEntity>? result = await AssetPicker.pickAssets(
      context,
      pickerConfig: AssetPickerConfig(
        maxAssets: 1,
        requestType: RequestType.image,
        pickerTheme: _pickerTheme,
        textDelegate: const EnglishAssetPickerTextDelegate(),
        specialItems: [
          SpecialItem(
            position: SpecialItemPosition.prepend,
            builder: (context, path, length) {
              return GestureDetector(
                onTap: () async {
                  final AssetEntity? result = await CameraPicker.pickFromCamera(
                    context,
                    pickerConfig: CameraPickerConfig(
                      textDelegate: const EnglishCameraPickerTextDelegate(),
                      theme: _pickerTheme,
                    ),
                  );
                  if (result != null && context.mounted) {
                    Navigator.of(context).pop(<AssetEntity>[result]);
                  }
                },
                child: Container(
                  color: Colors.grey[850],
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      PhosphorIcon(PhosphorIconsRegular.camera, color: Colors.white, size: 40),
                      SizedBox(height: 8),
                      Text(
                        'Take photo',
                        style: TextStyle(color: Colors.white, fontSize: 14),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );

    if (result != null && result.isNotEmpty) {
      // Use originFile to get the full-resolution original image
      final file = await result.first.originFile;
      if (file != null) {
        // Validate image format
        final formatError = _validateImageFormat(file.path);
        if (formatError != null) {
          print('⚠️ Image rejected: $formatError');
          return null; // Return null for unsupported format
        }

        if (compress) {
          return await _compressImage(file);
        }
        return file;
      }
    }
    return null;
  }

  /// Pick multiple images from gallery
  /// Returns list of selected Files
  /// [onImageSkipped] - Optional callback when an image is skipped due to validation
  static Future<List<File>> pickMultipleImages(
    BuildContext context, {
    int maxAssets = 9,
    List<AssetEntity>? selectedAssets,
    void Function(String reason)? onImageSkipped,
  }) async {
    final List<AssetEntity>? result = await AssetPicker.pickAssets(
      context,
      pickerConfig: AssetPickerConfig(
        maxAssets: maxAssets,
        selectedAssets: selectedAssets,
        requestType: RequestType.image,
        pickerTheme: _pickerTheme,
        textDelegate: const EnglishAssetPickerTextDelegate(),
        specialItems: [
          SpecialItem(
            position: SpecialItemPosition.prepend,
            builder: (context, path, length) {
              return GestureDetector(
                onTap: () async {
                  final AssetEntity? result = await CameraPicker.pickFromCamera(
                    context,
                    pickerConfig: CameraPickerConfig(
                      textDelegate: const EnglishCameraPickerTextDelegate(),
                      theme: _pickerTheme,
                    ),
                  );
                  if (result != null && context.mounted) {
                    Navigator.of(context).pop(<AssetEntity>[result]);
                  }
                },
                child: Container(
                  color: Colors.grey[850],
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      PhosphorIcon(PhosphorIconsRegular.camera, color: Colors.white, size: 40),
                      SizedBox(height: 8),
                      Text(
                        'Take photo',
                        style: TextStyle(color: Colors.white, fontSize: 14),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );

    if (result != null && result.isNotEmpty) {
      final List<File> files = [];
      
      for (final asset in result) {
        // Use originFile to get the full-resolution original image
        // instead of file which may return a cached/compressed version
        final file = await asset.originFile;
        if (file != null) {
          print('📂 Picked file: ${path.basename(file.path)}');

          // Validate image format first
          final formatError = _validateImageFormat(file.path);
          if (formatError != null) {
            print('⚠️ Image rejected: $formatError');
            onImageSkipped?.call(formatError);
            continue; // Skip this image
          }

          // Validate image dimensions
          final validationError = await _validateImageDimensions(file);
          if (validationError != null) {
            print('⚠️ Image rejected: $validationError');
            onImageSkipped?.call(validationError);
            continue; // Skip this image
          }
          
          final originalSize = await file.length();
          print('📂 Original size before compression: ${(originalSize / 1024 / 1024).toStringAsFixed(2)} MB');
          // Compress the image before adding to list
          final compressedFile = await _compressImage(file);
          if (compressedFile != null) {
            files.add(compressedFile);
          }
        }
      }
      return files;
    }
    return [];
  }

  /// Pick a single image or video
  static Future<File?> pickSingleMedia(BuildContext context) async {
    final List<AssetEntity>? result = await AssetPicker.pickAssets(
      context,
      pickerConfig: AssetPickerConfig(
        maxAssets: 1,
        requestType: RequestType.common, // Images and videos
        pickerTheme: _pickerTheme,
        textDelegate: const EnglishAssetPickerTextDelegate(),
      ),
    );

    if (result != null && result.isNotEmpty) {
      return await result.first.file;
    }
    return null;
  }

  /// Take a photo directly using camera
  static Future<File?> takePhoto(BuildContext context) async {
    final AssetEntity? result = await CameraPicker.pickFromCamera(
      context,
      pickerConfig: CameraPickerConfig(
        textDelegate: const EnglishCameraPickerTextDelegate(),
        theme: _pickerTheme,
      ),
    );

    if (result != null) {
      return await result.file;
    }
    return null;
  }
}
