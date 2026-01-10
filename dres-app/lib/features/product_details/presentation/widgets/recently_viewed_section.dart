import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/product_card.dart';
import 'package:dres/core/widgets/product_archive_block.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/core/services/storage_service.dart';
import 'package:dres/core/constants/api_endpoints.dart';
import 'package:dres/core/utilities/currency_utils.dart';
import 'package:dres/l10n/app_localizations.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class RecentlyViewedSection extends StatefulWidget {
  /// The current variation ID to exclude from the list
  final String? excludeVariationId;

  const RecentlyViewedSection({super.key, this.excludeVariationId});

  @override
  State<RecentlyViewedSection> createState() => _RecentlyViewedSectionState();
}

class _RecentlyViewedSectionState extends State<RecentlyViewedSection> {
  late Future<List<ProductCardData>> _variationsFuture;

  @override
  void initState() {
    super.initState();
    _variationsFuture = _fetchRecentlyViewed();
  }

  Future<List<ProductCardData>> _fetchRecentlyViewed() async {
    final apiService = getIt<ApiService>();
    final storageService = getIt<StorageService>();
    final department = storageService.getUserDepartment() ?? 'men';

    try {
      final response = await apiService.dio.get(
        recentlyViewedVariations,
        queryParameters: {
          'limit': 20,
          'department': department,
        },
      );

      // Update currency from API response
      if (response.data['currency'] != null) {
        CurrencyUtils.updateFromResponse(
          Map<String, dynamic>.from(response.data['currency']),
        );
      }

      final variations = (response.data['docs'] as List)
          .map((p) => ProductCardData.fromJson(p))
          .where(
            (v) => v.id != widget.excludeVariationId,
          ) // Exclude current variation
          .toList();

      return variations;
    } catch (e) {
      // Return empty list silently - recently viewed is optional
      return [];
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        // Only show recently viewed if user is logged in
        if (state.status == AuthStatus.authenticated) {
          return FutureBuilder<List<ProductCardData>>(
            future: _variationsFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const SizedBox.shrink(); // Don't show loading for optional section
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
                      l10n.recentlyViewed,
                      style: AppTypography.titleXL.copyWith(
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Horizontal scrollable list
                  SizedBox(
                    height: 400,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: variations.length,
                      itemBuilder: (context, index) {
                        final variation = variations[index];
                        return SizedBox(
                          width: 200,
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
        } else {
          return const SizedBox.shrink();
        }
      },
    );
  }
}
