import 'dart:io';
import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/app_info_banner.dart';
import 'package:dres/core/utilities/image_picker_utils.dart';
import 'package:dres/features/sell/data/repositories/sell_repository.dart';
import 'package:dres/features/sell/presentation/widgets/photo_tips_banner.dart';
import 'package:dres/core/di/injection.dart';
import 'package:flutter_overlay_loader/flutter_overlay_loader.dart';
import 'package:reorderables/reorderables.dart';

class ImageManagementScreen extends StatefulWidget {
  final List<Map<String, dynamic>> existingImages; // Accept dynamic, we'll cast it properly
  final List<File> selectedImages;
  final Function(List<String>) onImagesChanged;
  final int maxImages;
  final String? authenticity;

  const ImageManagementScreen({
    super.key,
    required this.existingImages,
    required this.selectedImages,
    required this.onImagesChanged,
    this.maxImages = 10,
    this.authenticity,
  });

  @override
  State<ImageManagementScreen> createState() => _ImageManagementScreenState();
}

class _ImageManagementScreenState extends State<ImageManagementScreen> {
  late List<Map<String, String>> _existingImages; // Store {url, id} objects
  late List<File> _selectedImages;
  late List<Map<String, dynamic>> _allImages; // Store the ordered list of all images

  @override
  void initState() {
    super.initState();
    // Cast to the correct type to avoid runtime errors
    _existingImages = widget.existingImages.map((item) => {
      'url': item['url'] as String,
      'id': item['id'] as String,
    }).toList();
    _selectedImages = List.from(widget.selectedImages);

    // Initialize the ordered list
    _initializeAllImages();

    print('🖼️ Image Management Screen initialized');
    print('📷 Existing images received: ${_existingImages.length}');
    print('📷 Selected images received: ${_selectedImages.length}');
    print('📷 Existing image URLs: ${_existingImages.map((e) => e['url']).take(3).join(' | ')}');
  }

  void _initializeAllImages() {
    _allImages = [];
    
    // Add existing images (with their ObjectIds)
    for (int i = 0; i < _existingImages.length; i++) {
      final existingImage = _existingImages[i];
      _allImages.add({
        'id': 'existing_$i',
        'url': existingImage['url'],
        'objectId': existingImage['id'], // Store the real ObjectId
        'file': null,
        'isExisting': true,
        'originalIndex': i,
      });
    }
    
    // Add selected local images
    for (int i = 0; i < _selectedImages.length; i++) {
      _allImages.add({
        'id': 'selected_$i',
        'url': null,
        'file': _selectedImages[i],
        'isExisting': false,
        'originalIndex': i,
      });
    }
  }

  int get _totalImages => _allImages.length;

  void _onReorder(int oldIndex, int newIndex) {
    setState(() {      
      // Validate indices
      if (oldIndex < 0 || oldIndex >= _allImages.length) {
        return;
      }
      
      if (newIndex > _allImages.length) {
        newIndex = _allImages.length;
      }
      
      // If moving to the same position, do nothing
      if (oldIndex == newIndex) {
        return;
      }
      
      // Remove item from old position
      final item = _allImages.removeAt(oldIndex);
      
      // Adjust newIndex if we removed an item from before the insertion point
      final adjustedNewIndex = newIndex > oldIndex ? newIndex - 1 : newIndex;
      
      // Insert at new position (ensure it's within bounds)
      final finalIndex = adjustedNewIndex.clamp(0, _allImages.length);
      _allImages.insert(finalIndex, item);
      
      print('📋 Reordered: moved item from $oldIndex to $finalIndex');
    });
  }

  void _onRemoveImage(int index) {
    setState(() {
      if (index >= 0 && index < _allImages.length) {
        final removedImage = _allImages.removeAt(index);
        print('📋 Removed image at index $index: ${removedImage['isExisting'] ? 'existing' : 'new'}');
      }
    });
  }

  Future<void> _onAddPhotos() async {
    final remainingSlots = widget.maxImages - _totalImages;
    if (remainingSlots <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Maximum ${widget.maxImages} images allowed')),
      );
      return;
    }

    int skippedCount = 0;
    final files = await ImagePickerUtils.pickMultipleImages(
      context,
      maxAssets: remainingSlots,
      onImageSkipped: (reason) {
        skippedCount++;
        // Show snackbar for each skipped image
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(reason),
              backgroundColor: AppColors.error,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      },
    );

    if (files.isNotEmpty) {
      setState(() {
        // Add new images to the _allImages list
        for (final file in files) {
          _allImages.add({
            'id': 'selected_${_allImages.length}',
            'url': null,
            'file': file,
            'isExisting': false,
            'originalIndex': _allImages.length,
          });
        }
        print('📋 Added ${files.length} new images. Total: ${_allImages.length}');
      });
    }
    
    // Show summary if some images were skipped
    if (skippedCount > 0 && files.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('All $skippedCount selected images were too small. Please select larger images (min 500x500 pixels).'),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  void _onSave() async {
    print('💾 Saving from Image Management Screen');
    
    // Get all images in their current order from _allImages
    final allImageUrls = <String>[];
    final allImageIds = <String>[]; // Track ObjectIds separately
    
    // Count how many new images need uploading
    final newImagesCount = _allImages.where((img) => !img['isExisting']).length;
    
    if (newImagesCount > 0) {
      // Show loading overlay
      Loader.show(
        context,
        progressIndicator: const CircularProgressIndicator(
          color: AppColors.textPrimary,
        ),
        overlayColor: Colors.black54,
      );
    }
    
    try {
      int uploadedCount = 0;
      
      // Process images one by one to avoid overwhelming the server
      for (final imageData in _allImages) {
        if (imageData['isExisting']) {
          // Existing image - use the URL for display and the stored ObjectId
          allImageUrls.add(imageData['url']);
          allImageIds.add(imageData['objectId']); // Use the stored ObjectId directly
        } else {
          // New image - upload it one by one
          final file = imageData['file'] as File;
          uploadedCount++;
          print('📤 Uploading image $uploadedCount of $newImagesCount...');
          print('📂 File size: ${(await file.length() / 1024 / 1024).toStringAsFixed(2)} MB');
          
          // Wait for this upload to complete before starting the next one
          final uploadResult = await getIt<SellRepository>().uploadImage(file);
          
          // Use the display URL for the UI
          allImageUrls.add(uploadResult['url']!);
          allImageIds.add(uploadResult['id']!); // Store ObjectId separately
          print('✅ Image $uploadedCount uploaded: ${uploadResult['url']}');
          print('📋 ObjectId: ${uploadResult['id']}');
        }
      }
      
      // Hide loading overlay
      if (newImagesCount > 0) {
        Loader.hide();
      }
      
      print('📷 Total images to return: ${allImageUrls.length}');
      print('📷 Display URLs: ${allImageUrls.take(3).join(' | ')}');
      print('📷 ObjectIds: ${allImageIds.take(3).join(' | ')}');
      
      // Pass both URLs (for display) and ObjectIds (for server) to the callback
      widget.onImagesChanged(allImageUrls);
      Navigator.pop(context, {
        'imageUrls': allImageUrls,  // For display
        'imageIds': allImageIds,    // For server
      });
      
    } catch (e) {
      // Hide loading overlay on error
      if (newImagesCount > 0) {
        Loader.hide();
      }
      
      print('❌ Error uploading images: $e');
      
      // Provide more specific error messages
      String errorMessage = 'Error uploading images. Please try again.';
      
      if (e.toString().contains('uploadthing') || 
          e.toString().contains('UPLOAD_FAILED') ||
          e.toString().contains('Image upload service temporarily unavailable')) {
        errorMessage = 'Image upload service is temporarily unavailable. Please try again in a few minutes.';
      } else if (e.toString().contains('timeout')) {
        errorMessage = 'Upload timeout. Please check your connection and try again.';
      } else if (e.toString().contains('network') || e.toString().contains('connection')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 5),
          action: SnackBarAction(
            label: 'RETRY',
            textColor: Colors.white,
            onPressed: () => _onSave(), // Allow retry
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: PhosphorIcon(
            PhosphorIconsRegular.x,
            color: AppColors.textPrimary,
            size: 24,
          ),
        ),
        title: Text(
          'Manage Photos',
          style: AppTypography.titleL.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: _onSave,
            child: Text(
              'Save',
              style: AppTypography.bodyM.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Scrollable content
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  // Always show photo tips banner with tag examples
                  const PhotoTipsBanner(),

                  const SizedBox(height: 20),
                  _buildInfoBanner(),
                  const SizedBox(height: 20),
                  
                  // Images list
                  if (_allImages.isEmpty)
                    _buildEmptyState()
                  else
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: ReorderableColumn(
                        onReorder: _onReorder,
                        children: _allImages.asMap().entries.map((entry) {
                          final index = entry.key;
                          final imageData = entry.value;
                          return _buildImageListItem(
                            key: ValueKey(imageData['id']),
                            imageData: imageData,
                            index: index,
                          );
                        }).toList(),
                      ),
                    ),
                ],
              ),
            ),
          ),
          
          // Fixed bottom section - Add photos button
          Container(
            color: AppColors.background,
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: SizedBox(
                  width: double.infinity,
                  child: AppButton(
                    text: 'Add More Photos (${_totalImages}/${widget.maxImages})',
                    onPressed: _totalImages >= widget.maxImages ? null : _onAddPhotos,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          PhosphorIcon(
            PhosphorIconsRegular.image,
            size: 64,
            color: AppColors.textHint,
          ),
          const SizedBox(height: 16),
          Text(
            'No photos added yet',
            style: AppTypography.bodyL.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Add photos to start organizing them',
            style: AppTypography.bodyM.copyWith(
              color: AppColors.textHint,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImageListItem({
    required Key key,
    required Map<String, dynamic> imageData,
    required int index,
  }) {
    return Card(
      key: key,
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Drag handle
            PhosphorIcon(
              PhosphorIconsRegular.dotsSixVertical,
              size: 24,
              color: AppColors.textHint,
            ),
            const SizedBox(width: 12),
            
            // Image thumbnail
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.textHint),
                borderRadius: BorderRadius.circular(8),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(7),
                child: imageData['file'] != null
                    ? Image.file(
                        imageData['file'],
                        fit: BoxFit.cover,
                      )
                    : Image.network(
                        imageData['url'],
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: AppColors.textHint.withOpacity(0.1),
                            child: Center(
                              child: PhosphorIcon(
                                PhosphorIconsRegular.image,
                                size: 20,
                                color: AppColors.textHint,
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ),
            
            const SizedBox(width: 12),
            
            // Image info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'Photo ${index + 1}',
                        style: AppTypography.bodyL.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (index == 0) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            'Main Photo',
                            style: AppTypography.bodyS.copyWith(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    imageData['isExisting'] ? 'Uploaded' : 'New photo',
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            
            // Remove button
            IconButton(
              onPressed: () => _onRemoveImage(index),
              icon: PhosphorIcon(
                PhosphorIconsRegular.trash,
                size: 20,
                color: AppColors.error,
              ),
            ),
          ],
        ),
      ),
    );
  }
  Widget _buildInfoBanner() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: AppInfoBanner(
        title: 'Drag and drop to reorder photos.',
        text: 'The first photo will be your main image that buyers see first.',
      ),
    );
  }
}