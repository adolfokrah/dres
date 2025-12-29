import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/l10n/app_localizations.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

class AccordionItem extends StatefulWidget {
  final String title;
  final Widget content;
  final bool initiallyExpanded;

  const AccordionItem({
    super.key,
    required this.title,
    required this.content,
    this.initiallyExpanded = false,
  });

  @override
  State<AccordionItem> createState() => _AccordionItemState();
}

class _AccordionItemState extends State<AccordionItem> {
  late bool _isExpanded;

  @override
  void initState() {
    super.initState();
    _isExpanded = widget.initiallyExpanded;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Header
        GestureDetector(
          onTap: () {
            setState(() {
              _isExpanded = !_isExpanded;
            });
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
             decoration: BoxDecoration(
              color: AppColors.secondary,
              border: Border(
                bottom: BorderSide(
                  color: AppColors.textSecondary.withValues(alpha: 0.1),
                  width: 1,
                ),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  widget.title,
                  style: AppTypography.bodyL.copyWith(
                    fontWeight: FontWeight.w500
                  ),
                ),
                PhosphorIcon(
                  _isExpanded
                      ? PhosphorIconsRegular.caretUp
                      : PhosphorIconsRegular.caretDown,
                  size: 16,
                ),
              ],
            ),
          ),
        ),

        // Content
        if (_isExpanded)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.secondary,
             
            ),
            child: widget.content,
          ),
      ],
    );
  }
}

class DescriptionAccordion extends StatelessWidget {
  final String? description;

  const DescriptionAccordion({
    super.key,
    this.description,
  });

  @override
  Widget build(BuildContext context) {
    if (description == null || description!.isEmpty) {
      return const SizedBox.shrink();
    }

    return AccordionItem(
      title: 'DESCRIPTION',
      initiallyExpanded: true,
      content: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          description!,
          style: AppTypography.bodyL.copyWith(
            color: const Color(0xFF4E4E4E),
            height: 1.5,
          ),
        ),
      ),
    );
  }
}

class DetailsAccordion extends StatelessWidget {
  final Map<String, String> details;

  const DetailsAccordion({
    super.key,
    required this.details,
  });

  @override
  Widget build(BuildContext context) {
    if (details.isEmpty) {
      return const SizedBox.shrink();
    }

    return AccordionItem(
      title: 'DETAILS',
      content: Column(
        children: details.entries.map((entry) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Attribute name (left)
                Expanded(
                  child: Text(
                    '${entry.key}:',
                    style: AppTypography.bodyL.copyWith(
                      color: const Color(0xFF4E4E4E),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                // Value (right, bold)
                Expanded(
                  child: Text(
                    entry.value,
                    style: AppTypography.bodyL.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                    textAlign: TextAlign.right,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

class FreeListingReturnsAccordion extends StatelessWidget {
  const FreeListingReturnsAccordion({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return AccordionItem(
      title: l10n.freeListingOrReturns,
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Free Relisting Section
          Text(
            l10n.freeRelisting,
            style: AppTypography.bodyL.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            l10n.freeRelistingDescription,
            style: AppTypography.bodyL.copyWith(
              color: const Color(0xFF4E4E4E),
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(left: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '• ${l10n.wrongItemSent}',
                  style: AppTypography.bodyL.copyWith(
                    color: const Color(0xFF4E4E4E),
                  ),
                ),
                Text(
                  '• ${l10n.fakeNotAuthentic}',
                  style: AppTypography.bodyL.copyWith(
                    color: const Color(0xFF4E4E4E),
                  ),
                ),
                Text(
                  '• ${l10n.itemArrivedDamaged}',
                  style: AppTypography.bodyL.copyWith(
                    color: const Color(0xFF4E4E4E),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Free Returns Section
          Text(
            l10n.freeReturnsBuyerProtection,
            style: AppTypography.bodyL.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            l10n.freeReturnsDescription,
            style: AppTypography.bodyL.copyWith(
              color: const Color(0xFF4E4E4E),
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(left: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '• ${l10n.returnIssues48Hours}',
                  style: AppTypography.bodyL.copyWith(
                    color: const Color(0xFF4E4E4E),
                  ),
                ),
                Text(
                  '• ${l10n.weCoverReturnDelivery}',
                  style: AppTypography.bodyL.copyWith(
                    color: const Color(0xFF4E4E4E),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
