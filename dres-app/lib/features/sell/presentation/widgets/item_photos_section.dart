import 'dart:io';
import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/utilities/image_picker_utils.dart';

class ItemPhotosSection extends StatefulWidget {
  final List<String> existingImages; // URLs of already uploaded images
  final List<File> selectedImages; // Locally selected images
  final Function(List<File>) onImagesChanged;
  final Function(int)? onExistingImageRemoved; // Callback when existing image is removed
  final VoidCallback? onPhotoTipsTap;
  final int maxImages;

  const ItemPhotosSection({
    super.key,
    this.existingImages = const [],
    this.selectedImages = const [],
    required this.onImagesChanged,
    this.onExistingImageRemoved,
    this.onPhotoTipsTap,
    this.maxImages = 10,
  });

  @override
  State<ItemPhotosSection> createState() => _ItemPhotosSectionState();
}

class _ItemPhotosSectionState extends State<ItemPhotosSection> {
  late List<File> _selectedImages;

  @override
  void initState() {
    super.initState();
    _selectedImages = List.from(widget.selectedImages);
  }

  @override
  void didUpdateWidget(ItemPhotosSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.selectedImages != oldWidget.selectedImages) {
      _selectedImages = List.from(widget.selectedImages);
    }
  }

  Future<void> _onAddPhotos() async {
    final remainingSlots = widget.maxImages - _totalImageCount;
    if (remainingSlots <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Maximum ${widget.maxImages} images allowed')),
      );
      return;
    }

    final files = await ImagePickerUtils.pickMultipleImages(
      context,
      maxAssets: remainingSlots,
    );

    if (files.isNotEmpty) {
      setState(() {
        _selectedImages.addAll(files);
      });
      widget.onImagesChanged(_selectedImages);
    }
  }

  void _onRemoveImage(int index) {
    setState(() {
      _selectedImages.removeAt(index);
    });
    widget.onImagesChanged(_selectedImages);
  }

  int get _totalImageCount =>
      widget.existingImages.length + _selectedImages.length;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.secondary, width: 10),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Item Photos',
                  style: AppTypography.bodyL.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Clear, detailed photos will help your items sell faster.',
                  style: AppTypography.bodyM.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Add Photos button - full width
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: SizedBox(
              width: double.infinity,
              child: AppButton.outlined(
                text: _totalImageCount > 0
                    ? 'Add More Photos ($_totalImageCount/${widget.maxImages})'
                    : 'Add Photos',
                onPressed: _totalImageCount >= widget.maxImages
                    ? null
                    : _onAddPhotos,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Photo thumbnails grid
          if (_totalImageCount > 0)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: _buildPhotoGrid(),
            )
          else
            // Empty state - show camera placeholders
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: List.generate(4, (index) {
                  return Expanded(
                    child: GestureDetector(
                      onTap: _onAddPhotos,
                      child: Container(
                        margin: EdgeInsets.only(right: index < 3 ? 10 : 0),
                        height: 60,
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.textHint),
                        ),
                        child: Center(
                          child: PhosphorIcon(
                            PhosphorIcons.camera(),
                            color: AppColors.textHint,
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
          const SizedBox(height: 16),

          // Photo tips
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GestureDetector(
              onTap: widget.onPhotoTipsTap,
              child: Row(
                children: [
                  Text(
                    'Read our photo tips',
                    style: AppTypography.bodyM.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(width: 6),
                  PhosphorIcon(
                    PhosphorIcons.info(),
                    color: AppColors.textPrimary,
                    size: 14,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildPhotoGrid() {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        // Existing images (already uploaded)
        ...widget.existingImages.asMap().entries.map((entry) {
          return _buildImageThumbnail(
            imageUrl: entry.value,
            index: entry.key,
            isExisting: true,
          );
        }),
        // Selected local images
        ..._selectedImages.asMap().entries.map((entry) {
          return _buildImageThumbnail(
            file: entry.value,
            index: entry.key,
            isExisting: false,
          );
        }),
        // Add more button if under limit
        if (_totalImageCount < widget.maxImages) _buildAddMoreThumbnail(),
      ],
    );
  }

  Widget _buildImageThumbnail({
    String? imageUrl,
    File? file,
    required int index,
    required bool isExisting,
  }) {
    return Stack(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.textHint),
            borderRadius: BorderRadius.circular(4),
            image: DecorationImage(
              image: file != null
                  ? FileImage(file)
                  : NetworkImage(imageUrl!) as ImageProvider,
              fit: BoxFit.contain,
            ),
          ),
        ),
        // Remove button (for both local and existing images)
        Positioned(
          top: 4,
          right: 4,
          child: GestureDetector(
            onTap: () {
              if (isExisting) {
                widget.onExistingImageRemoved?.call(index);
              } else {
                _onRemoveImage(index);
              }
            },
            child: Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, color: Colors.white, size: 14),
            ),
          ),
        ),
        // First image badge
        if (index == 0 && isExisting ||
            (index == 0 && widget.existingImages.isEmpty && !isExisting))
          Positioned(
            bottom: 4,
            left: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                borderRadius: BorderRadius.circular(2),
              ),
              child: Text(
                'Main',
                style: AppTypography.bodyS.copyWith(
                  color: Colors.white,
                  fontSize: 10,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildAddMoreThumbnail() {
    return GestureDetector(
      onTap: _onAddPhotos,
      child: Container(
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          border: Border.all(
            color: AppColors.textHint,
            style: BorderStyle.solid,
          ),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            PhosphorIcon(
              PhosphorIcons.plus(),
              color: AppColors.textHint,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              'Add',
              style: AppTypography.bodyS.copyWith(
                color: AppColors.textHint,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
