import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

/// Multi-line text area widget with same styling as AppTextField
class AppTextArea extends StatelessWidget {
  final TextEditingController? controller;
  final String? label;
  final String? hintText;
  final String? Function(String?)? validator;
  final bool enabled;
  final int maxLines;
  final int? minLines;
  final int? maxLength;
  final void Function(String)? onChanged;
  final TextCapitalization textCapitalization;

  const AppTextArea({
    super.key,
    this.controller,
    this.label,
    this.hintText,
    this.validator,
    this.enabled = true,
    this.maxLines = 5,
    this.minLines,
    this.maxLength,
    this.onChanged,
    this.textCapitalization = TextCapitalization.sentences,
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
        TextFormField(
          controller: controller,
          validator: validator,
          keyboardType: TextInputType.multiline,
          enabled: enabled,
          maxLines: maxLines,
          minLines: minLines ?? 3,
          maxLength: maxLength,
          onChanged: onChanged,
          textCapitalization: textCapitalization,
          style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: AppTypography.bodyM.copyWith(color: AppColors.textHint),
            filled: !enabled,
            fillColor: enabled ? null : AppColors.disabled.withOpacity(0.1),
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
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.zero,
              borderSide: BorderSide(color: AppColors.error),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.zero,
              borderSide: BorderSide(color: AppColors.error),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.zero,
              borderSide: BorderSide(color: AppColors.border.withOpacity(0.5)),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 16,
            ),
            // Hide the counter if maxLength is set
            counterText: '',
          ),
        ),
      ],
    );
  }
}
