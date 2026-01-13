import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/widgets/app_text_field.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/features/saved_searches/logic/saved_searches_bloc/saved_searches_bloc.dart';

class SaveSearchDialog extends StatefulWidget {
  const SaveSearchDialog({
    super.key,
    required this.searchData,
    this.suggestedName,
  });

  final Map<String, dynamic> searchData;
  final String? suggestedName;

  @override
  State<SaveSearchDialog> createState() => _SaveSearchDialogState();
}

class _SaveSearchDialogState extends State<SaveSearchDialog> {
  late TextEditingController _nameController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.suggestedName);
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(
        'Save Search',
        style: AppTypography.titleL.copyWith(
          fontWeight: FontWeight.bold,
        ),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Give your search a name so you can find it later and get notified when new items match.',
            style: AppTypography.bodyM.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 20),
          AppTextField(
            controller: _nameController,
            label: 'Search name',
            hintText: 'e.g., Red Dresses Under \$50',
            textCapitalization: TextCapitalization.words,
          ),
          const SizedBox(height: 20),
          Text(
            'Search criteria:',
            style: AppTypography.bodyM.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.background,
              border: Border.all(color: AppColors.border),
            ),
            child: Text(
              _buildSearchSummary(),
              style: AppTypography.bodyS.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
      actions: [
        AppButton.outlined(
          text: 'Cancel',
          onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
        ),
        const SizedBox(width: 12),
        BlocListener<SavedSearchesBloc, SavedSearchesState>(
          listener: (context, state) {
            // Handle success
            if (state.status == SavedSearchesStatus.success && _isLoading) {
              setState(() => _isLoading = false);
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Search saved successfully!'),
                  backgroundColor: AppColors.success,
                ),
              );
            }
            // Handle failure
            else if (state.status == SavedSearchesStatus.failure) {
              setState(() => _isLoading = false);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.errorMessage ?? 'Failed to save search'),
                  backgroundColor: AppColors.error,
                ),
              );
            }
          },
          child: AppButton.filled(
            text: 'Save',
            isLoading: _isLoading,
            onPressed: _isLoading ? null : _saveSearch,
          ),
        ),
      ],
    );
  }

  void _saveSearch() {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please enter a name for your search'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    
    getIt<SavedSearchesBloc>().add(
      SavedSearchSaveRequested(
        name: name,
        searchData: widget.searchData,
      ),
    );
  }

  String _buildSearchSummary() {
    final searchData = widget.searchData;
    final List<String> criteria = [];

    if (searchData['departmentName'] != null) {
      criteria.add('Department: ${searchData['departmentName']}');
    }
    if (searchData['collectionName'] != null) {
      criteria.add('Collection: ${searchData['collectionName']}');
    }
    if (searchData['categoryName'] != null) {
      criteria.add('Category: ${searchData['categoryName']}');
    }
    if (searchData['brandName'] != null) {
      criteria.add('Brand: ${searchData['brandName']}');
    }
    if (searchData['minPrice'] != null || searchData['maxPrice'] != null) {
      final min = searchData['minPrice'];
      final max = searchData['maxPrice'];
      if (min != null && max != null) {
        criteria.add('Price: \$${min} - \$${max}');
      } else if (min != null) {
        criteria.add('Min Price: \$${min}');
      } else if (max != null) {
        criteria.add('Max Price: \$${max}');
      }
    }
    if (searchData['selectedAttributes'] != null) {
      final attributes = searchData['selectedAttributes'] as Map<String, dynamic>?;
      if (attributes != null && attributes.isNotEmpty) {
        criteria.add('${attributes.length} attribute filter(s)');
      }
    }

    if (criteria.isEmpty) {
      return 'All products';
    }

    return criteria.join('\n');
  }
}

// Helper function to show the dialog
Future<void> showSaveSearchDialog(
  BuildContext context, {
  required Map<String, dynamic> searchData,
  String? suggestedName,
}) {
  return showDialog(
    context: context,
    builder: (context) => BlocProvider.value(
      value: getIt<SavedSearchesBloc>(),
      child: SaveSearchDialog(
        searchData: searchData,
        suggestedName: suggestedName,
      ),
    ),
  );
}