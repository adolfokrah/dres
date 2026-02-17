import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/widgets/app_snackbar.dart';
import 'package:dres/features/sell/data/repositories/sell_repository.dart';

/// A dedicated color picker section that appears before the attributes section.
/// Color is a required attribute and cannot be removed.
class ColorSection extends StatelessWidget {
  /// The Color attribute model (from available attributes)
  final AttributeModel? colorAttribute;

  /// Currently selected color option ID
  final String? selectedColorId;

  /// Currently selected color option name
  final String? selectedColorName;

  /// Called when a color is selected
  final Function(String colorId, String colorName) onColorSelected;

  const ColorSection({
    super.key,
    required this.colorAttribute,
    this.selectedColorId,
    this.selectedColorName,
    required this.onColorSelected,
  });

  @override
  Widget build(BuildContext context) {
    final hasColor = selectedColorId != null && selectedColorId!.isNotEmpty;

    return Container(
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.secondary, width: 1),
        ),
      ),
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: colorAttribute != null
            ? () => _openColorPicker(context)
            : null,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: Row(
            children: [
              Text(
                'Color',
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
              const Spacer(),
              Text(
                hasColor ? selectedColorName! : 'Select color',
                style: AppTypography.bodyM.copyWith(
                  color: hasColor
                      ? AppColors.textPrimary
                      : AppColors.textSecondary,
                ),
              ),
              const SizedBox(width: 8),
              PhosphorIcon(
                PhosphorIconsRegular.caretRight,
                size: 14,
                color: AppColors.textPrimary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openColorPicker(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _ColorPickerScreen(
          colorAttribute: colorAttribute!,
          selectedId: selectedColorId,
          onSelected: (id, name) {
            onColorSelected(id, name);
          },
        ),
      ),
    );
  }
}

class _ColorPickerScreen extends StatefulWidget {
  final AttributeModel colorAttribute;
  final String? selectedId;
  final Function(String id, String name) onSelected;

  const _ColorPickerScreen({
    required this.colorAttribute,
    this.selectedId,
    required this.onSelected,
  });

  @override
  State<_ColorPickerScreen> createState() => _ColorPickerScreenState();
}

class _ColorPickerScreenState extends State<_ColorPickerScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  late List<AttributeOptionModel> _options;
  bool _isCreating = false;

  @override
  void initState() {
    super.initState();
    _options = List.from(widget.colorAttribute.options);
  }

  List<AttributeOptionModel> get _filteredOptions {
    if (_searchQuery.isEmpty) return _options;
    final query = _searchQuery.toLowerCase();
    return _options
        .where((o) => o.name.toLowerCase().contains(query))
        .toList();
  }

  bool get _canCreateNew {
    if (_searchQuery.trim().isEmpty) return false;
    return _filteredOptions.isEmpty;
  }

  Future<void> _createNewColor() async {
    final name = _searchQuery.trim();
    if (name.isEmpty) return;

    setState(() => _isCreating = true);

    try {
      final repo = getIt<SellRepository>();
      final newOption = await repo.createAttributeOption(
        attributeId: widget.colorAttribute.id,
        name: name,
      );

      // Add to local list
      setState(() {
        _options.add(newOption);
        _isCreating = false;
      });

      // Select the newly created color and go back
      widget.onSelected(newOption.id, newOption.name);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() => _isCreating = false);
      if (mounted) {
        AppSnackbar.error(context, 'Failed to create color');
      }
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredOptions;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            UnifiedHeader.titleOnly(title: 'Select Color'),

            // Search bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              child: TextField(
                controller: _searchController,
                onChanged: (value) => setState(() => _searchQuery = value),
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                ),
                decoration: InputDecoration(
                  hintText: 'Search or add a color...',
                  hintStyle: AppTypography.bodyM.copyWith(
                    color: AppColors.textHint,
                  ),
                  prefixIcon: Padding(
                    padding: const EdgeInsets.only(left: 12, right: 8),
                    child: PhosphorIcon(
                      PhosphorIcons.magnifyingGlass(),
                      color: AppColors.textHint,
                      size: 20,
                    ),
                  ),
                  prefixIconConstraints: const BoxConstraints(
                    minWidth: 40,
                    minHeight: 40,
                  ),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? GestureDetector(
                          onTap: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                          child: Padding(
                            padding: const EdgeInsets.only(right: 12),
                            child: PhosphorIcon(
                              PhosphorIcons.x(),
                              color: AppColors.textSecondary,
                              size: 18,
                            ),
                          ),
                        )
                      : null,
                  suffixIconConstraints: const BoxConstraints(
                    minWidth: 40,
                    minHeight: 40,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  border: const OutlineInputBorder(
                    borderRadius: BorderRadius.zero,
                    borderSide: BorderSide(color: AppColors.secondary),
                  ),
                  enabledBorder: const OutlineInputBorder(
                    borderRadius: BorderRadius.zero,
                    borderSide: BorderSide(color: AppColors.secondary),
                  ),
                  focusedBorder: const OutlineInputBorder(
                    borderRadius: BorderRadius.zero,
                    borderSide: BorderSide(color: AppColors.textPrimary),
                  ),
                ),
              ),
            ),

            // Color list
            Expanded(
              child: ListView(
                children: [
                  // "Add new" option when search doesn't match any existing color
                  if (_canCreateNew)
                    GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: _isCreating ? null : _createNewColor,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 16,
                        ),
                        decoration: const BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: AppColors.secondary,
                              width: 1,
                            ),
                          ),
                        ),
                        child: Row(
                          children: [
                            PhosphorIcon(
                              PhosphorIcons.plus(),
                              color: AppColors.textPrimary,
                              size: 18,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Add "${_searchQuery.trim()}"',
                                style: AppTypography.bodyM.copyWith(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            if (_isCreating)
                              const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),

                  // Existing colors
                  ...filtered.map((option) {
                    final isSelected = option.id == widget.selectedId;

                    return GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () {
                        widget.onSelected(option.id, option.name);
                        Navigator.pop(context);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 16,
                        ),
                        decoration: const BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: AppColors.secondary,
                              width: 1,
                            ),
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                option.name,
                                style: AppTypography.bodyM.copyWith(
                                  color: AppColors.textPrimary,
                                  fontWeight: isSelected
                                      ? FontWeight.w700
                                      : FontWeight.w400,
                                ),
                              ),
                            ),
                            if (isSelected)
                              PhosphorIcon(
                                PhosphorIcons.check(),
                                color: AppColors.textPrimary,
                                size: 20,
                              ),
                          ],
                        ),
                      ),
                    );
                  }),

                  // Empty state
                  if (filtered.isEmpty && !_canCreateNew)
                    Padding(
                      padding: const EdgeInsets.all(40),
                      child: Center(
                        child: Text(
                          'No colors found',
                          style: AppTypography.bodyM.copyWith(
                            color: AppColors.textHint,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
