import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/features/sell/data/models/attribute_model.dart';

export 'package:dres/features/sell/data/models/attribute_model.dart';

/// A selected attribute with its value
class SelectedAttribute {
  final String attributeId;
  final String attributeName;
  final String? valueId;
  final String? valueName;

  const SelectedAttribute({
    required this.attributeId,
    required this.attributeName,
    this.valueId,
    this.valueName,
  });

  SelectedAttribute copyWith({
    String? attributeId,
    String? attributeName,
    String? valueId,
    String? valueName,
  }) {
    return SelectedAttribute(
      attributeId: attributeId ?? this.attributeId,
      attributeName: attributeName ?? this.attributeName,
      valueId: valueId ?? this.valueId,
      valueName: valueName ?? this.valueName,
    );
  }

  /// Display string for the attribute (e.g., "Color: Black")
  String get displayString {
    if (attributeName.isEmpty) {
      return 'Tap to select attribute';
    }
    if (valueName != null && valueName!.isNotEmpty) {
      return '$attributeName: $valueName';
    }
    return attributeName;
  }

  bool get isComplete => valueId != null && valueId!.isNotEmpty;
}

class AttributesSection extends StatefulWidget {
  final List<AttributeModel> availableAttributes;
  final List<SelectedAttribute> selectedAttributes;
  final Function(List<SelectedAttribute>) onAttributesChanged;
  final VoidCallback? onAddAttribute;

  const AttributesSection({
    super.key,
    required this.availableAttributes,
    required this.selectedAttributes,
    required this.onAttributesChanged,
    this.onAddAttribute,
  });

  @override
  State<AttributesSection> createState() => _AttributesSectionState();
}

class _AttributesSectionState extends State<AttributesSection> {
  // Track which attribute cards are expanded
  final Map<int, bool> _expandedCards = {};

  @override
  void didUpdateWidget(AttributesSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    // When a new attribute is added, expand it by default
    if (widget.selectedAttributes.length > oldWidget.selectedAttributes.length) {
      final newIndex = widget.selectedAttributes.length - 1;
      _expandedCards[newIndex] = true;
      // Auto-open the attribute type picker for new empty attributes
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final newAttr = widget.selectedAttributes[newIndex];
        if (newAttr.attributeId.isEmpty && mounted) {
          // Attribute is new and empty - picker will open when user sees the expanded card
        }
      });
    }
  }

  void _toggleExpanded(int index) {
    setState(() {
      _expandedCards[index] = !(_expandedCards[index] ?? false);
    });
  }

  void _onAttributeTypeSelected(int index, AttributeModel type) {
    final updated = List<SelectedAttribute>.from(widget.selectedAttributes);
    updated[index] = SelectedAttribute(
      attributeId: type.id,
      attributeName: type.name,
      valueId: null,
      valueName: null,
    );
    widget.onAttributesChanged(updated);
  }

  void _onAttributeValueSelected(int index, AttributeOptionModel option) {
    final updated = List<SelectedAttribute>.from(widget.selectedAttributes);
    updated[index] = updated[index].copyWith(
      valueId: option.id,
      valueName: option.name,
    );
    widget.onAttributesChanged(updated);
  }

  void _onRemoveAttribute(int index) {
    final updated = List<SelectedAttribute>.from(widget.selectedAttributes);
    updated.removeAt(index);
    widget.onAttributesChanged(updated);
  }

  // Get available attribute types (excluding already selected ones)
  List<AttributeModel> _getAvailableTypes(String? currentAttributeId) {
    final selectedIds = widget.selectedAttributes
        .where((a) => a.attributeId != currentAttributeId)
        .map((a) => a.attributeId)
        .toSet();
    return widget.availableAttributes
        .where((a) => !selectedIds.contains(a.id))
        .toList();
  }

  // Get options for a selected attribute type
  List<AttributeOptionModel> _getOptionsForAttribute(String attributeId) {
    final attr = widget.availableAttributes.firstWhere(
      (a) => a.id == attributeId,
      orElse: () =>
          const AttributeModel(id: '', name: '', level: '', options: []),
    );
    return attr.options;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.secondary, width: 10),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 10),
          // Selected attribute cards
          ...widget.selectedAttributes.asMap().entries.map((entry) {
            final index = entry.key;
            final attribute = entry.value;
            final isExpanded = _expandedCards[index] ?? false;

            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _AttributeCard(
                attribute: attribute,
                isExpanded: isExpanded,
                onToggleExpanded: () => _toggleExpanded(index),
                availableTypes: _getAvailableTypes(attribute.attributeId),
                availableOptions: _getOptionsForAttribute(
                  attribute.attributeId,
                ),
                onTypeSelected: (type) => _onAttributeTypeSelected(index, type),
                onValueSelected: (option) =>
                    _onAttributeValueSelected(index, option),
                onRemove: () => _onRemoveAttribute(index),
              ),
            );
          }),

          // Add attribute button
          if (widget.onAddAttribute != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: widget.onAddAttribute,
                child: Row(
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.textPrimary),
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Center(
                        child: PhosphorIcon(
                          PhosphorIcons.plus(),
                          color: AppColors.textPrimary,
                          size: 14,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Add attribute',
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 10),
        ],
      ),
    );
  }
}

class _AttributeCard extends StatelessWidget {
  final SelectedAttribute attribute;
  final bool isExpanded;
  final VoidCallback onToggleExpanded;
  final List<AttributeModel> availableTypes;
  final List<AttributeOptionModel> availableOptions;
  final Function(AttributeModel) onTypeSelected;
  final Function(AttributeOptionModel) onValueSelected;
  final VoidCallback onRemove;

  const _AttributeCard({
    required this.attribute,
    required this.isExpanded,
    required this.onToggleExpanded,
    required this.availableTypes,
    required this.availableOptions,
    required this.onTypeSelected,
    required this.onValueSelected,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border.all(color: AppColors.secondary),
      ),
      child: Column(
        children: [
          // Header - shows selected attribute summary
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: AppColors.secondary,
              border: Border(
                bottom: BorderSide(color: AppColors.secondary, width: 1),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: onToggleExpanded,
                    child: Text(
                      attribute.displayString,
                      style: AppTypography.bodyL.copyWith(
                        color: attribute.attributeName.isEmpty 
                            ? AppColors.textHint 
                            : AppColors.textPrimary,
                        fontStyle: attribute.attributeName.isEmpty 
                            ? FontStyle.italic 
                            : FontStyle.normal,
                      ),
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: onRemove,
                  child: PhosphorIcon(
                    PhosphorIcons.trash(),
                    color: AppColors.error,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: onToggleExpanded,
                  child: PhosphorIcon(
                    isExpanded
                        ? PhosphorIcons.caretUp()
                        : PhosphorIcons.caretDown(),
                    color: AppColors.textPrimary,
                    size: 14,
                  ),
                ),
              ],
            ),
          ),

          // Expanded content - two dropdowns
          if (isExpanded) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(9, 11, 9, 13),
              child: Column(
                children: [
                  // Attribute type selector
                  _DropdownField(
                    label: attribute.attributeName.isNotEmpty
                        ? attribute.attributeName
                        : 'Select attribute',
                    onTap: () => _showAttributeTypePicker(context),
                  ),
                  const SizedBox(height: 10),
                  // Attribute value selector
                  _DropdownField(
                    label: attribute.valueName ?? 'Select value',
                    enabled: attribute.attributeId.isNotEmpty,
                    onTap: attribute.attributeId.isNotEmpty
                        ? () => _showAttributeValuePicker(context)
                        : null,
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showAttributeTypePicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      builder: (context) => _AttributePickerSheet(
        title: 'Select Attribute',
        items: availableTypes.map((t) => (id: t.id, name: t.name)).toList(),
        selectedId: attribute.attributeId,
        onSelected: (id, name) {
          final type = availableTypes.firstWhere((t) => t.id == id);
          onTypeSelected(type);
          Navigator.pop(context);
        },
      ),
    );
  }

  void _showAttributeValuePicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      builder: (context) => _AttributePickerSheet(
        title: 'Select Value',
        items: availableOptions.map((o) => (id: o.id, name: o.name)).toList(),
        selectedId: attribute.valueId,
        onSelected: (id, name) {
          final option = availableOptions.firstWhere((o) => o.id == id);
          onValueSelected(option);
          Navigator.pop(context);
        },
      ),
    );
  }
}

class AttributeDropdownField extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final bool enabled;

  const AttributeDropdownField({
    super.key,
    required this.label,
    this.onTap,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          border: Border.all(
            color: enabled ? AppColors.textPrimary : AppColors.textHint,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: AppTypography.bodyL.copyWith(
                  color: enabled ? AppColors.textPrimary : AppColors.textHint,
                ),
              ),
            ),
            PhosphorIcon(
              PhosphorIcons.caretDown(),
              color: enabled ? AppColors.textPrimary : AppColors.textHint,
              size: 14,
            ),
          ],
        ),
      ),
    );
  }
}

// Keep the private version for backward compatibility within this file
class _DropdownField extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final bool enabled;

  const _DropdownField({required this.label, this.onTap, this.enabled = true});

  @override
  Widget build(BuildContext context) {
    return AttributeDropdownField(
      label: label,
      onTap: onTap,
      enabled: enabled,
    );
  }
}

/// A bottom sheet for picking attributes or attribute options
class AttributePickerSheet extends StatelessWidget {
  final String title;
  final List<({String id, String name})> items;
  final String? selectedId;
  final Function(String id, String name) onSelected;

  const AttributePickerSheet({
    super.key,
    required this.title,
    required this.items,
    this.selectedId,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Text(
                  title,
                  style: AppTypography.bodyL.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: PhosphorIcon(
                    PhosphorIcons.x(),
                    color: AppColors.textPrimary,
                    size: 20,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.secondary),
          // Options list
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                final isSelected = item.id == selectedId;
                return ListTile(
                  title: Text(
                    item.name,
                    style: AppTypography.bodyL.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
                    ),
                  ),
                  trailing: isSelected
                      ? PhosphorIcon(
                          PhosphorIcons.check(),
                          color: AppColors.textPrimary,
                          size: 20,
                        )
                      : null,
                  onTap: () => onSelected(item.id, item.name),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// Keep the private version for backward compatibility within this file
class _AttributePickerSheet extends StatelessWidget {
  final String title;
  final List<({String id, String name})> items;
  final String? selectedId;
  final Function(String id, String name) onSelected;

  const _AttributePickerSheet({
    required this.title,
    required this.items,
    this.selectedId,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return AttributePickerSheet(
      title: title,
      items: items,
      selectedId: selectedId,
      onSelected: onSelected,
    );
  }
}

/// A single attribute card widget for SKU details
/// Allows selecting one attribute type and one value
class SkuAttributeCard extends StatefulWidget {
  final List<AttributeModel> availableAttributes;
  final String? selectedAttributeId;
  final String? selectedAttributeName;
  final String? selectedOptionId;
  final String? selectedOptionName;
  final Function(String attributeId, String attributeName) onAttributeSelected;
  final Function(String optionId, String optionName) onOptionSelected;

  const SkuAttributeCard({
    super.key,
    required this.availableAttributes,
    this.selectedAttributeId,
    this.selectedAttributeName,
    this.selectedOptionId,
    this.selectedOptionName,
    required this.onAttributeSelected,
    required this.onOptionSelected,
  });

  @override
  State<SkuAttributeCard> createState() => _SkuAttributeCardState();
}

class _SkuAttributeCardState extends State<SkuAttributeCard> {
  bool _isExpanded = true;

  String get _displayString {
    if (widget.selectedOptionName != null &&
        widget.selectedOptionName!.isNotEmpty) {
      return '${widget.selectedAttributeName ?? 'Attribute'}: ${widget.selectedOptionName}';
    }
    return widget.selectedAttributeName ?? 'Select attribute';
  }

  List<AttributeOptionModel> get _availableOptions {
    if (widget.selectedAttributeId == null) return [];
    final attr = widget.availableAttributes.firstWhere(
      (a) => a.id == widget.selectedAttributeId,
      orElse: () =>
          const AttributeModel(id: '', name: '', level: '', options: []),
    );
    return attr.options;
  }

  void _showAttributePicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      builder: (context) => AttributePickerSheet(
        title: 'Select Attribute',
        items: widget.availableAttributes
            .map((a) => (id: a.id, name: a.name))
            .toList(),
        selectedId: widget.selectedAttributeId,
        onSelected: (id, name) {
          widget.onAttributeSelected(id, name);
          Navigator.pop(context);
        },
      ),
    );
  }

  void _showOptionPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      builder: (context) => AttributePickerSheet(
        title: 'Select Value',
        items: _availableOptions.map((o) => (id: o.id, name: o.name)).toList(),
        selectedId: widget.selectedOptionId,
        onSelected: (id, name) {
          widget.onOptionSelected(id, name);
          Navigator.pop(context);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasAttribute = widget.selectedAttributeId != null &&
        widget.selectedAttributeId!.isNotEmpty;

    return Container(
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.secondary, width: 10),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.background,
            border: Border.all(color: AppColors.secondary),
          ),
          child: Column(
            children: [
              // Header - shows selected attribute summary
              GestureDetector(
                onTap: () => setState(() => _isExpanded = !_isExpanded),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: AppColors.secondary,
                    border: Border(
                      bottom: BorderSide(color: AppColors.secondary, width: 1),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          _displayString,
                          style: AppTypography.bodyL.copyWith(
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      PhosphorIcon(
                        _isExpanded
                            ? PhosphorIcons.caretUp()
                            : PhosphorIcons.caretDown(),
                        color: AppColors.textPrimary,
                        size: 14,
                      ),
                    ],
                  ),
                ),
              ),

              // Expanded content - attribute and value selectors
              if (_isExpanded) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(9, 11, 9, 13),
                  child: Column(
                    children: [
                      // Attribute type selector
                      AttributeDropdownField(
                        label: widget.selectedAttributeName ?? 'Select attribute',
                        enabled: widget.availableAttributes.isNotEmpty,
                        onTap: widget.availableAttributes.isNotEmpty
                            ? _showAttributePicker
                            : null,
                      ),
                      const SizedBox(height: 10),
                      // Attribute value selector
                      AttributeDropdownField(
                        label: widget.selectedOptionName ?? 'Select value',
                        enabled: hasAttribute && _availableOptions.isNotEmpty,
                        onTap: hasAttribute && _availableOptions.isNotEmpty
                            ? _showOptionPicker
                            : null,
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
