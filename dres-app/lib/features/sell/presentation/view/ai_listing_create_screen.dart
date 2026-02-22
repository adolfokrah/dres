import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/utilities/image_picker_utils.dart';
import 'package:dres/features/sell/logic/ai_listing_bloc/ai_listing_bloc.dart';
import 'package:dres/features/sell/logic/ai_listing_bloc/ai_listing_event.dart';
import 'package:dres/features/sell/logic/ai_listing_bloc/ai_listing_state.dart';
import 'package:dres/features/sell/logic/sell_bloc/sell_bloc.dart';
import 'package:dres/features/sell/presentation/view/select_category_screen.dart';

class AIListingCreateScreen extends StatefulWidget {
  const AIListingCreateScreen({super.key});

  @override
  State<AIListingCreateScreen> createState() => _AIListingCreateScreenState();
}

class _AIListingCreateScreenState extends State<AIListingCreateScreen> {
  final _priceController = TextEditingController();
  final _stockController = TextEditingController();
  final _sizesController = TextEditingController();

  String? _selectedAuthenticity; // 'original' or 'replica'
  SelectedCategoryData? _selectedCategory; // Department, collection and category selection

  @override
  void dispose() {
    _priceController.dispose();
    _stockController.dispose();
    _sizesController.dispose();
    super.dispose();
  }

  Future<void> _pickImages(BuildContext context) async {
    // Get BLoC reference before async operation
    final bloc = BlocProvider.of<AIListingBloc>(context);

    try {
      final files = await ImagePickerUtils.pickMultipleImages(
        context,
        maxAssets: 10,
      );

      if (files.isNotEmpty && mounted) {
        bloc.add(AIListingImagesAdded(images: files));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to pick images: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  List<String> _parseSizes() {
    final sizesText = _sizesController.text.trim();
    if (sizesText.isEmpty) return [];
    return sizesText.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
  }

  List<double> _parsePrices() {
    final text = _priceController.text.trim();
    if (text.isEmpty) return [];
    return text
        .split(',')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .map((s) => double.tryParse(s))
        .whereType<double>()
        .toList();
  }

  List<int?> _parseStocks() {
    final text = _stockController.text.trim();
    if (text.isEmpty) return [];
    return text
        .split(',')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .map((s) => int.tryParse(s))
        .toList();
  }

  void _onSubmit(BuildContext context) {
    final sizes = _parseSizes();
    final prices = _parsePrices();
    final stocks = _parseStocks();

    // Get bloc reference
    final bloc = BlocProvider.of<AIListingBloc>(context);

    // Update all fields in bloc
    bloc.add(AIListingSizesUpdated(sizes: sizes));
    bloc.add(AIListingPriceUpdated(prices: prices));
    bloc.add(AIListingDepartmentUpdated(department: _selectedCategory?.departmentId ?? ''));
    bloc.add(AIListingStockUpdated(stocks: stocks));
    bloc.add(AIListingAuthenticityUpdated(authenticity: _selectedAuthenticity));

    // Submit
    bloc.add(const AIListingSubmitted());
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => getIt<AIListingBloc>(),
      child: BlocListener<AIListingBloc, AIListingState>(
        listener: (context, state) {
          if (state.status == AIListingStatus.success && state.createdStyleId != null) {
            // Show success message
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Product created successfully! Check your notifications.'),
                backgroundColor: Colors.green,
              ),
            );

            // Refresh the draft styles list
            getIt<SellBloc>().add(SellRefreshRequested());

            // Pop back to sell page
            Navigator.of(context).pop();
          }

          if (state.status == AIListingStatus.failure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage ?? 'Failed to create listing'),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        child: Scaffold(
          backgroundColor: AppColors.background,
          body: SafeArea(
            child: Column(
              children: [
                const UnifiedHeader.simple(
                  title: 'Create with AI',
                  showSearchIcon: false,
                ),
                Expanded(
                  child: BlocBuilder<AIListingBloc, AIListingState>(
                    builder: (context, state) {
                      if (state.status == AIListingStatus.uploadingImages) {
                        return _buildUploadingState(state);
                      }

                      if (state.status == AIListingStatus.submitting) {
                        return _buildSubmittingState();
                      }

                      return _buildForm(context, state);
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildUploadingState(AIListingState state) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: AppColors.primary),
          const SizedBox(height: 24),
          Text(
            'Uploading images...',
            style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Text(
            '${(state.uploadProgress * 100).toInt()}%',
            style: AppTypography.bodyL.copyWith(
              color: AppColors.primary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubmittingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: AppColors.primary),
          const SizedBox(height: 24),
          Text(
            'AI is analyzing your product...',
            style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Text(
            'This may take a few moments',
            style: AppTypography.bodyS.copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildForm(BuildContext context, AIListingState state) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // AI Info Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primary.withAlpha(13),
              border: Border.all(color: AppColors.primary),
            ),
            child: Row(
              children: [
                PhosphorIcon(
                  PhosphorIcons.sparkle(),
                  color: AppColors.primary,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Upload photos and provide details. AI will automatically detect colors, variations, and create your listing.',
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Photo Tips Banner
          // const PhotoTipsBanner(),
          const SizedBox(height: 24),

          // Images Section
          _buildSectionTitle('Product Photos', required: true),
          const SizedBox(height: 12),
          _buildImagesSection(state),
          const SizedBox(height: 24),

          // Department, Collection & Category
          _buildSectionTitle('Department / Collection / Category', required: true),
          const SizedBox(height: 12),
          _buildCategorySelector(context, state),
          const SizedBox(height: 24),

          // Sizes
          _buildSectionTitle('Available Sizes', required: true),
          const SizedBox(height: 12),
          _buildSizesField(),
          const SizedBox(height: 24),

          // Price
          _buildSectionTitle('Price per item', required: true),
          const SizedBox(height: 12),
          TextField(
            controller: _priceController,
            keyboardType: TextInputType.text,
            style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
            decoration: InputDecoration(
              hintText: 'e.g., 120 or 120, 240, 50',
              hintStyle: AppTypography.bodyM.copyWith(
                color: AppColors.textHint,
              ),
              prefixText: '₵ ',
              prefixStyle: AppTypography.bodyM.copyWith(
                color: AppColors.textPrimary,
              ),
              helperText: 'Single price for all sizes, or comma-separated per size',
              helperStyle: AppTypography.bodyS.copyWith(
                color: AppColors.textSecondary,
              ),
              filled: true,
              fillColor: AppColors.surface,
              border: const OutlineInputBorder(borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.all(16),
            ),
          ),
          const SizedBox(height: 24),

          // Stock (Optional)
          _buildSectionTitle('Stock per size', required: false),
          const SizedBox(height: 12),
          TextField(
            controller: _stockController,
            keyboardType: TextInputType.text,
            style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
            decoration: InputDecoration(
              hintText: 'e.g., 10 or 5, 10, 15',
              hintStyle: AppTypography.bodyM.copyWith(
                color: AppColors.textHint,
              ),
              helperText: 'Leave empty for unlimited, or comma-separated per size',
              helperStyle: AppTypography.bodyS.copyWith(
                color: AppColors.textSecondary,
              ),
              filled: true,
              fillColor: AppColors.surface,
              border: const OutlineInputBorder(borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.all(16),
            ),
          ),
          const SizedBox(height: 24),

          // Authenticity
          _buildSectionTitle('Authenticity', required: true),
          const SizedBox(height: 12),
          _buildAuthenticitySelector(),
          const SizedBox(height: 32),

          // Submit Button
          Builder(
            builder: (context) => SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _canSubmit(state) ? () => _onSubmit(context) : null,
                style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.textOnPrimary,
                disabledBackgroundColor: AppColors.border,
                disabledForegroundColor: AppColors.textHint,
                shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  PhosphorIcon(
                    PhosphorIcons.sparkle(),
                    color: _canSubmit(state)
                        ? AppColors.textOnPrimary
                        : AppColors.textHint,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Create with AI',
                    style: AppTypography.bodyM.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, {required bool required}) {
    return Row(
      children: [
        Text(
          title,
          style: AppTypography.bodyM.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
        if (required) ...[
          const SizedBox(width: 4),
          Text(
            '*',
            style: AppTypography.bodyM.copyWith(
              color: AppColors.error,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildImagesSection(AIListingState state) {
    return Column(
      children: [
        if (state.images.isNotEmpty)
          SizedBox(
            height: 120,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: state.images.length + 1,
              itemBuilder: (context, index) {
                if (index == state.images.length) {
                  return _buildAddImageButton();
                }
                return _buildImageItem(state.images[index], index);
              },
            ),
          )
        else
          _buildAddImageButton(large: true),
      ],
    );
  }

  Widget _buildImageItem(File image, int index) {
    return Container(
      width: 120,
      height: 120,
      margin: const EdgeInsets.only(right: 12),
      child: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              image: DecorationImage(
                image: FileImage(image),
                fit: BoxFit.cover,
              ),
            ),
          ),
          Positioned(
            top: 4,
            right: 4,
            child: Builder(
              builder: (context) => GestureDetector(
                onTap: () {
                  BlocProvider.of<AIListingBloc>(context).add(
                    AIListingImageRemoved(index: index),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: AppColors.error,
                    shape: BoxShape.circle,
                  ),
                  child: PhosphorIcon(
                    PhosphorIcons.x(),
                    color: Colors.white,
                    size: 16,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddImageButton({bool large = false}) {
    return Builder(
      builder: (context) => GestureDetector(
        onTap: () => _pickImages(context),
        child: Container(
          width: large ? double.infinity : 120,
          height: large ? 160 : 120,
          margin: large ? null : const EdgeInsets.only(right: 12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            border: Border.all(color: AppColors.border, style: BorderStyle.solid),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              PhosphorIcon(
                PhosphorIcons.plus(),
                color: AppColors.textSecondary,
                size: large ? 32 : 24,
              ),
              const SizedBox(height: 8),
              Text(
                large ? 'Add Photos' : 'Add',
                style: AppTypography.bodyS.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategorySelector(BuildContext context, AIListingState state) {
    return GestureDetector(
      onTap: () async {
        final bloc = context.read<AIListingBloc>();
        final result = await context.push<SelectedCategoryData>('/sell/select-department');

        if (result != null && mounted) {
          setState(() {
            _selectedCategory = result;
          });

          // Dispatch events to BLoC
          bloc.add(
            AIListingCollectionUpdated(collection: result.collectionId),
          );
          bloc.add(
            AIListingCategoryUpdated(category: result.categoryId),
          );
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border.all(
            color: _selectedCategory != null ? AppColors.primary : AppColors.border,
            width: _selectedCategory != null ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.category_outlined,
              color: _selectedCategory != null ? AppColors.primary : AppColors.textSecondary,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                _selectedCategory?.displayText ?? 'Tap to select collection & category',
                style: AppTypography.bodyM.copyWith(
                  color: _selectedCategory != null
                      ? AppColors.textPrimary
                      : AppColors.textHint,
                ),
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: AppColors.textSecondary,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSizesField() {
    return TextField(
      controller: _sizesController,
      style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
      decoration: InputDecoration(
        hintText: 'e.g., S, M, L, XL',
        hintStyle: AppTypography.bodyM.copyWith(
          color: AppColors.textHint,
        ),
        helperText: 'Separate sizes with commas',
        helperStyle: AppTypography.bodyS.copyWith(
          color: AppColors.textSecondary,
        ),
        filled: true,
        fillColor: AppColors.surface,
        border: const OutlineInputBorder(borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.all(16),
      ),
    );
  }

  Widget _buildAuthenticitySelector() {
    return Column(
      children: [
        _buildAuthenticityOption('Original', 'original'),
        const SizedBox(height: 8),
        _buildAuthenticityOption('Replica', 'replica'),
      ],
    );
  }

  Widget _buildAuthenticityOption(String label, String value) {
    final isSelected = _selectedAuthenticity == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedAuthenticity = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? AppColors.primary : AppColors.border,
                  width: 2,
                ),
                color: isSelected ? AppColors.primary : Colors.transparent,
              ),
              child: isSelected
                  ? const Center(
                      child: Icon(
                        Icons.check,
                        size: 12,
                        color: AppColors.textOnPrimary,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textPrimary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool _canSubmit(AIListingState state) {
    if (state.images.isEmpty ||
        _sizesController.text.trim().isEmpty ||
        _priceController.text.trim().isEmpty ||
        _selectedCategory == null ||
        _selectedAuthenticity == null) {
      return false;
    }

    final sizes = _parseSizes();
    final prices = _parsePrices();
    final stocks = _parseStocks();

    // Prices: must have values, all > 0, count must be 1 or match sizes
    if (prices.isEmpty || prices.any((p) => p <= 0)) return false;
    if (prices.length != 1 && prices.length != sizes.length) return false;

    // Stocks: if provided, count must be 1 or match sizes
    if (stocks.isNotEmpty && stocks.length != 1 && stocks.length != sizes.length) {
      return false;
    }

    return true;
  }
}
