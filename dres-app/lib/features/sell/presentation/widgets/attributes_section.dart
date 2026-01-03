import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/features/sell/data/models/attribute_model.dart';

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
          GestureDetector(
            onTap: onToggleExpanded,
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
                      attribute.displayString,
                      style: AppTypography.bodyL.copyWith(
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  PhosphorIcon(
                    isExpanded
                        ? PhosphorIcons.caretUp()
                        : PhosphorIcons.caretDown(),
                    color: AppColors.textPrimary,
                    size: 14,
                  ),
                ],
              ),
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
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
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
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
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

class _DropdownField extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final bool enabled;

  const _DropdownField({required this.label, this.onTap, this.enabled = true});

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
                      fontWeight: isSelected
                          ? FontWeight.w700
                          : FontWeight.w400,
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
