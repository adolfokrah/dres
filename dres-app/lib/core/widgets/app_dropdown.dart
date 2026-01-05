import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

/// A custom dropdown widget that matches the app's design system.
/// Uses a bottom sheet for selection on mobile.
class AppDropdown<T> extends StatelessWidget {
  final String? label;
  final String hintText;
  final T? value;
  final List<T> items;
  final String Function(T) itemLabel;
  final void Function(T?) onChanged;
  final bool enabled;
  final bool isLoading;
  final String? errorText;

  const AppDropdown({
    super.key,
    this.label,
    required this.hintText,
    this.value,
    required this.items,
    required this.itemLabel,
    required this.onChanged,
    this.enabled = true,
    this.isLoading = false,
    this.errorText,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: AppTypography.bodyM.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
        ],
        InkWell(
          onTap: enabled && !isLoading ? () => _showBottomSheet(context) : null,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              border: Border.all(
                color: errorText != null
                    ? AppColors.error
                    : AppColors.border,
              ),
              color: enabled ? null : AppColors.disabled.withValues(alpha: 0.1),
            ),
            child: Row(
              children: [
                Expanded(
                  child: isLoading
                      ? Row(
                          children: [
                            SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.textHint,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Loading...',
                              style: AppTypography.bodyM.copyWith(
                                color: AppColors.textHint,
                              ),
                            ),
                          ],
                        )
                      : Text(
                          value != null ? itemLabel(value as T) : hintText,
                          style: AppTypography.bodyM.copyWith(
                            color: value != null
                                ? AppColors.textPrimary
                                : AppColors.textHint,
                          ),
                        ),
                ),
                PhosphorIcon(
                  PhosphorIcons.caretDown(),
                  size: 14,
                  color: AppColors.textPrimary,
                ),
              ],
            ),
          ),
        ),
        if (errorText != null) ...[
          const SizedBox(height: 8),
          Text(
            errorText!,
            style: AppTypography.caption.copyWith(
              color: AppColors.error,
            ),
          ),
        ],
      ],
    );
  }

  void _showBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(0)),
      ),
      isScrollControlled: true,
      builder: (context) => _DropdownBottomSheet<T>(
        title: label ?? hintText,
        items: items,
        selectedValue: value,
        itemLabel: itemLabel,
        onSelect: (item) {
          Navigator.pop(context);
          onChanged(item);
        },
      ),
    );
  }
}

class _DropdownBottomSheet<T> extends StatefulWidget {
  final String title;
  final List<T> items;
  final T? selectedValue;
  final String Function(T) itemLabel;
  final void Function(T) onSelect;

  const _DropdownBottomSheet({
    required this.title,
    required this.items,
    this.selectedValue,
    required this.itemLabel,
    required this.onSelect,
  });

  @override
  State<_DropdownBottomSheet<T>> createState() => _DropdownBottomSheetState<T>();
}

class _DropdownBottomSheetState<T> extends State<_DropdownBottomSheet<T>> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<T> get _filteredItems {
    if (_searchQuery.isEmpty) return widget.items;
    return widget.items
        .where((item) => widget
            .itemLabel(item)
            .toLowerCase()
            .contains(_searchQuery.toLowerCase()))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final maxHeight = MediaQuery.of(context).size.height * 0.7;

    return Container(
      constraints: BoxConstraints(maxHeight: maxHeight),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  widget.title,
                  style: AppTypography.bodyL.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: PhosphorIcon(
                    PhosphorIcons.x(),
                    size: 20,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.divider),
          // Search field
          if (widget.items.length > 10)
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _searchController,
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                ),
                decoration: InputDecoration(
                  hintText: 'Search...',
                  hintStyle: AppTypography.bodyM.copyWith(
                    color: AppColors.textHint,
                  ),
                  prefixIcon: PhosphorIcon(
                    PhosphorIcons.magnifyingGlass(),
                    size: 20,
                    color: AppColors.textHint,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.zero,
                    borderSide: BorderSide(color: AppColors.border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.zero,
                    borderSide: BorderSide(color: AppColors.border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.zero,
                    borderSide: BorderSide(color: AppColors.textPrimary),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
              ),
            ),
          // Items list
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: _filteredItems.length,
              itemBuilder: (context, index) {
                final item = _filteredItems[index];
                final isSelected = widget.selectedValue != null &&
                    widget.itemLabel(widget.selectedValue as T) ==
                        widget.itemLabel(item);

                return InkWell(
                  onTap: () => widget.onSelect(item),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 16,
                    ),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: AppColors.divider,
                          width: 1,
                        ),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            widget.itemLabel(item),
                            style: AppTypography.bodyM.copyWith(
                              color: AppColors.textPrimary,
                              fontWeight: isSelected
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                            ),
                          ),
                        ),
                        if (isSelected)
                          PhosphorIcon(
                            PhosphorIcons.check(),
                            size: 20,
                            color: AppColors.textPrimary,
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
