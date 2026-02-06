import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/product_card.dart';
import 'package:dres/core/widgets/product_archive_block.dart';
import 'package:dres/features/product_details/data/repositories/similar_variations_repository.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/l10n/app_localizations.dart';

class SimilarVariationsSection extends StatefulWidget {
  final String variationId;

  const SimilarVariationsSection({
    super.key,
    required this.variationId,
  });

  @override
  State<SimilarVariationsSection> createState() => _SimilarVariationsSectionState();
}

class _SimilarVariationsSectionState extends State<SimilarVariationsSection> {
  late final SimilarVariationsRepository _repository;
  late Future<List<ProductCardData>> _variationsFuture;

  @override
  void initState() {
    super.initState();
    _repository = getIt<SimilarVariationsRepository>();
    _variationsFuture = _repository.getSimilarVariations(
      variationId: widget.variationId,
      limit: 20,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return FutureBuilder<List<ProductCardData>>(
      future: _variationsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: CircularProgressIndicator(),
            ),
          );
        }

        if (snapshot.hasError) {
          return const SizedBox.shrink();
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const SizedBox.shrink();
        }

        final variations = snapshot.data!;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                l10n.youMayAlsoLike,
                style: AppTypography.titleXL.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            const SizedBox(height: 16),
            
            // Horizontal scrollable list
            SizedBox(
              height: 310,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                itemCount: variations.length,
                separatorBuilder: (context, index) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  final variation = variations[index];
                  return SizedBox(
                    width: 140,
                    child: ProductCard(
                      id: variation.id,
                      thumbnail: variation.thumbnail,
                      brand: variation.brand,
                      category: variation.category,
                      title: variation.title,
                      price: variation.price,
                      compareAtPrice: variation.compareAtPrice,
                      currencyCode: variation.currencyCode,
                      currencySymbol: variation.currencySymbol,
                      slug: variation.slug,
                      isFavorited: false,
                      showLeftBorder: index == 0, // Show left border only for first item
                      showTopBorder: true, // Show top border for all items
                      isBoosted: variation.isBoosted,
                      showWeLoveBadge: variation.showWeLoveBadge,
                      sellerId: variation.sellerId,
                      totalStock: variation.totalStock,
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }
}
