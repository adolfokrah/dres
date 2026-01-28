import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/app_text_field.dart';
import 'package:dres/core/widgets/app_text_area.dart';
import 'package:dres/core/widgets/app_snackbar.dart';
import 'package:dres/features/sell/presentation/widgets/sell_selector_row.dart';
import 'package:dres/features/sell/presentation/view/select_category_screen.dart';
import 'package:dres/features/sell/presentation/view/select_brand_screen.dart';
import 'package:dres/features/sell/logic/style_details_bloc/style_details_bloc.dart';
import 'package:dres/features/sell/logic/sell_bloc/sell_bloc.dart';

class StyleDetailsScreen extends StatefulWidget {
  /// The style ID (required - must be created before navigating here)
  final String styleId;

  const StyleDetailsScreen({super.key, required this.styleId});

  @override
  State<StyleDetailsScreen> createState() => _StyleDetailsScreenState();
}

class _StyleDetailsScreenState extends State<StyleDetailsScreen> {
  late final StyleDetailsBloc _styleDetailsBloc;
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();

  // Selected category data (stores IDs for API submission)
  String? _selectedDepartmentId;
  String? _selectedDepartmentName;
  String? _selectedCollectionId;
  String? _selectedCollectionName;
  String? _selectedCategoryId;
  String? _selectedCategoryName;

  // Selected brand data
  String? _selectedBrandId;
  String? _selectedBrandName;

  // Authenticity of item
  String? _selectedAuthenticity; // 'original' or 'replica'

  bool _isUpdating = false;

  @override
  void initState() {
    super.initState();
    _styleDetailsBloc = getIt<StyleDetailsBloc>();
    // Load existing style data if available
    _styleDetailsBloc.add(StyleDetailsLoadRequested(styleId: widget.styleId));
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _populateFromState(StyleDetailsState state) {
    if (state.styleDetails != null) {
      final details = state.styleDetails!;

      if (_titleController.text.isEmpty && details.title != null) {
        _titleController.text = details.title!;
      }
      if (_descriptionController.text.isEmpty && details.description != null) {
        _descriptionController.text = details.description!;
      }
      if (_selectedDepartmentId == null && details.departmentId != null) {
        _selectedDepartmentId = details.departmentId;
        _selectedDepartmentName = details.departmentName;
      }
      if (_selectedCollectionId == null && details.collectionId != null) {
        _selectedCollectionId = details.collectionId;
        _selectedCollectionName = details.collectionName;
      }
      if (_selectedCategoryId == null && details.categoryId != null) {
        _selectedCategoryId = details.categoryId;
        _selectedCategoryName = details.categoryName;
      }
      if (_selectedBrandId == null && details.brandId != null) {
        _selectedBrandId = details.brandId;
        _selectedBrandName = details.brandName;
      }
      if (_selectedAuthenticity == null && details.authenticity != null) {
        _selectedAuthenticity = details.authenticity;
      }
    }
  }

  String get _categoryDisplayText {
    if (_selectedCategoryName != null) {
      final parts = <String>[];
      if (_selectedDepartmentName != null) parts.add(_selectedDepartmentName!);
      if (_selectedCollectionName != null) parts.add(_selectedCollectionName!);
      if (_selectedCategoryName != null) parts.add(_selectedCategoryName!);
      return parts.join(' / ');
    }
    return '';
  }

  bool get _canProceed {
    return _titleController.text.trim().isNotEmpty &&
        _selectedCategoryId != null &&
        _selectedBrandId != null &&
        _selectedAuthenticity != null;
  }

  String get _authenticityDisplayText {
    switch (_selectedAuthenticity) {
      case 'original':
        return 'Original';
      case 'replica':
        return 'Replica';
      default:
        return '';
    }
  }

  Future<void> _onCategoryTap() async {
    final result = await context.push<SelectedCategoryData>(
      '/sell/select-department',
    );

    if (result != null) {
      setState(() {
        _selectedDepartmentId = result.departmentId;
        _selectedDepartmentName = result.departmentName;
        _selectedCollectionId = result.collectionId;
        _selectedCollectionName = result.collectionName;
        _selectedCategoryId = result.categoryId;
        _selectedCategoryName = result.categoryName;
      });
    }
  }

  Future<void> _onBrandTap() async {
    final result = await context.push<SelectedBrandData>('/sell/select-brand');

    if (result != null) {
      setState(() {
        _selectedBrandId = result.brandId;
        _selectedBrandName = result.brandName;
      });
    }
  }

  void _onSave() {
    if (!_canProceed || _isUpdating) return;

    // Update the style with the current data
    _styleDetailsBloc.add(
      StyleDetailsUpdateRequested(
        styleId: widget.styleId,
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        departmentId: _selectedDepartmentId,
        collectionId: _selectedCollectionId,
        categoryId: _selectedCategoryId!,
        brandId: _selectedBrandId!,
        authenticity: _selectedAuthenticity,
      ),
    );
  }

  Future<void> _onAuthenticityTap() async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: const Text('Original'),
                onTap: () => Navigator.of(context).pop('original'),
              ),
              ListTile(
                title: const Text('Replica'),
                onTap: () => Navigator.of(context).pop('replica'),
              ),
            ],
          ),
        );
      },
    );

    if (selected != null) {
      setState(() {
        _selectedAuthenticity = selected;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _styleDetailsBloc,
      child: BlocConsumer<StyleDetailsBloc, StyleDetailsState>(
        listener: (context, state) {
          // Populate form when data is loaded
          if (state.status == StyleDetailsStatus.loaded) {
            _populateFromState(state);
            setState(() {});
          }

          // Handle updating state
          if (state.status == StyleDetailsStatus.updating) {
            setState(() => _isUpdating = true);
          }

          // Handle update success - go back to overview screen
          if (state.status == StyleDetailsStatus.updateSuccess) {
            setState(() => _isUpdating = false);
            // Refetch drafts so it reflects the updated data
            getIt<SellBloc>().add(const SellRefreshRequested());
            // Show success message and go back
            AppSnackbar.success(context, 'Product details saved');
            context.pop();
          }

          // Handle failure
          if (state.status == StyleDetailsStatus.failure) {
            setState(() => _isUpdating = false);
            AppSnackbar.error(context, state.errorMessage ?? 'Failed to save');
          }
        },
        builder: (context, state) {
          final isLoading = state.status == StyleDetailsStatus.loading;

          return Scaffold(
            backgroundColor: AppColors.background,
            body: SafeArea(
              child: Column(
                children: [
                  // Header
                  UnifiedHeader.titleOnly(
                    title: 'Product Details',
                    onBackTap: () => context.pop(),
                  ),

                  // Content
                  Expanded(
                    child: isLoading
                        ? const Center(
                            child: CircularProgressIndicator(
                              color: AppColors.textPrimary,
                            ),
                          )
                        : SingleChildScrollView(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: 20),

                                // Title field
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                  ),
                                  child: AppTextField(
                                    label: 'Title',
                                    controller: _titleController,
                                    hintText: 'Enter product title',
                                    onChanged: (_) => setState(() {}),
                                  ),
                                ),

                                const SizedBox(height: 16),

                                // Description field
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                  ),
                                  child: AppTextArea(
                                    label: 'Description',
                                    controller: _descriptionController,
                                    hintText: 'Describe your item...',
                                    maxLines: 5,
                                    onChanged: (_) => setState(() {}),
                                  ),
                                ),

                                const SizedBox(height: 16),

                                // Category selector
                                SellSelectorRow(
                                  label: 'Category',
                                  value: _categoryDisplayText,
                                  onTap: _onCategoryTap,
                                ),

                                // Brand selector
                                SellSelectorRow(
                                  label: 'Brand',
                                  value: _selectedBrandName ?? '',
                                  onTap: _onBrandTap,
                                ),

                                // Authenticity selector
                                SellSelectorRow(
                                  label: 'Authenticity of item',
                                  value: _authenticityDisplayText,
                                  onTap: _onAuthenticityTap,
                                ),

                                const SizedBox(height: 20),
                              ],
                            ),
                          ),
                  ),

                  // Bottom buttons
                  _buildBottomButtons(),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBottomButtons() {
    return Container(
      padding: const EdgeInsets.all(20),
      width: double.infinity,
      child: AppButton.filled(
        text: _isUpdating ? 'Saving...' : 'Save',
        onPressed: _canProceed && !_isUpdating ? _onSave : null,
      ),
    );
  }
}
