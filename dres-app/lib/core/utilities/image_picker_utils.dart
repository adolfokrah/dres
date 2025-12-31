import 'dart:io';
import 'package:flutter/material.dart';
import 'package:wechat_assets_picker/wechat_assets_picker.dart';
import 'package:wechat_camera_picker/wechat_camera_picker.dart';
import 'package:dres/core/theme/app_colors.dart';

/// Utility class for picking images using wechat_assets_picker
class ImagePickerUtils {
  ImagePickerUtils._();

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
  static Future<File?> pickSingleImage(BuildContext context) async {
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
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.camera_alt, color: Colors.white, size: 40),
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
      return await result.first.file;
    }
    return null;
  }

  /// Pick multiple images from gallery
  /// Returns list of selected Files
  static Future<List<File>> pickMultipleImages(
    BuildContext context, {
    int maxAssets = 9,
    List<AssetEntity>? selectedAssets,
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
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.camera_alt, color: Colors.white, size: 40),
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
        final file = await asset.file;
        if (file != null) {
          files.add(file);
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
