import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/product_card.dart';
import 'package:dres/core/widgets/product_archive_block.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/core/constants/api_endpoints.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/l10n/app_localizations.dart';

/// Recently viewed section for the home screen.
/// Shows products the user has recently viewed.
/// Hides itself if there are no recently viewed items or user is not logged in.
class RecentlyViewedHomeSection extends StatefulWidget {
  const RecentlyViewedHomeSection({super.key});

  @override
  State<RecentlyViewedHomeSection> createState() => _RecentlyViewedHomeSectionState();
}

class _RecentlyViewedHomeSectionState extends State<RecentlyViewedHomeSection> {
  late Future<List<ProductCardData>> _variationsFuture;

  @override
  void initState() {
    super.initState();
    _variationsFuture = _fetchRecentlyViewed();
  }

  Future<List<ProductCardData>> _fetchRecentlyViewed() async {
    final apiService = getIt<ApiService>();

    try {
      final response = await apiService.dio.get(
        recentlyViewedVariations,
        queryParameters: {
          'limit': 10,
        },
      );

      // Update currency from API response
      if (response.data['currency'] != null) {
        CurrencyUtils.updateFromResponse(
          Map<String, dynamic>.from(response.data['currency']),
        );
      }

      return (response.data['docs'] as List)
          .map((p) => ProductCardData.fromJson(p))
          .toList();
    } catch (e) {
      // Return empty list silently - recently viewed is optional
      return [];
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return FutureBuilder<List<ProductCardData>>(
      future: _variationsFuture,
      builder: (context, snapshot) {
        // Don't show anything while loading or on error
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox.shrink();
        }

        if (snapshot.hasError || !snapshot.hasData || snapshot.data!.isEmpty) {
          return const SizedBox.shrink();
        }

        final variations = snapshot.data!;

        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Section header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Text(
                  l10n.recentlyViewed,
                  style: AppTypography.titleL.copyWith(
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Horizontal scrollable list
              SizedBox(
                height: 380,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: variations.length,
                  itemBuilder: (context, index) {
                    final variation = variations[index];
                    return SizedBox(
                      width: 180,
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
                        showLeftBorder: index == 0,
                        showTopBorder: true,
                        isBoosted: variation.isBoosted,
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
