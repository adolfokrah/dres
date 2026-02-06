import 'package:dres/core/widgets/app_button.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'product_card.dart';
import '../constants/api_endpoints.dart';
import '../di/injection.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../utilities/currency_utils.dart';

enum QueryType { trending, newArrivals, recentlyViewed, featured, weLove, onSale }

class ProductArchiveBlock extends StatefulWidget {
  final String title;
  final QueryType queryType;
  final bool showSeeAll;
  final String seeAllText;
  final String? department;
  final int limit;
  final Function(String id, bool isFavorited)? onFavoriteToggle;
  final Set<String> favoritedProducts;
  /// Variation ID to exclude from results (useful for "recently viewed" on product details)
  final String? excludeVariationId;

  const ProductArchiveBlock({
    super.key,
    required this.title,
    required this.queryType,
    this.showSeeAll = true,
    this.seeAllText = 'See all',
    this.department,
    this.limit = 8,
    this.onFavoriteToggle,
    this.favoritedProducts = const {},
    this.excludeVariationId,
  });

  @override
  State<ProductArchiveBlock> createState() => _ProductArchiveBlockState();
}

class _ProductArchiveBlockState extends State<ProductArchiveBlock> {
  late Future<List<ProductCardData>> _productsFuture;

  @override
  void initState() {
    super.initState();
    _productsFuture = _fetchProducts();
  }

  @override
  void didUpdateWidget(ProductArchiveBlock oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Refetch products if department changes
    if (oldWidget.department != widget.department) {
      setState(() {
        _productsFuture = _fetchProducts();
      });
    }
  }

  Future<List<ProductCardData>> _fetchProducts() async {
    final departmentId = widget.department ?? 'men';
    final apiService = getIt<ApiService>();

    String endpoint;
    if (widget.queryType == QueryType.trending) {
      endpoint = trendingVariations;
    } else if (widget.queryType == QueryType.newArrivals) {
      endpoint = newArrivals;
    } else if (widget.queryType == QueryType.featured || widget.queryType == QueryType.weLove) {
      // Both featured and weLove use the same endpoint (which filters by showWeLoveBadge)
      endpoint = featuredVariations;
    } else if (widget.queryType == QueryType.recentlyViewed) {
      endpoint = recentlyViewedVariations;
    } else if (widget.queryType == QueryType.onSale) {
      endpoint = filteredVariations;
    } else {
      return [];
    }
    
    final queryParams = <String, dynamic>{
      'limit': widget.limit,
      'department': departmentId,
    };

    // Add filterType for on-sale query
    if (widget.queryType == QueryType.onSale) {
      queryParams['filterType'] = 'on-sale';
    }
    
    final response = await apiService.dio.get(
      endpoint,
      queryParameters: queryParams,
    );
    
    // Update currency from API response
    if (response.data['currency'] != null) {
      CurrencyUtils.updateFromResponse(
        Map<String, dynamic>.from(response.data['currency']),
      );
    }

    // The filtered endpoint returns 'variations', other endpoints return 'docs'
    final dataKey = widget.queryType == QueryType.onSale ? 'variations' : 'docs';
    var products = (response.data[dataKey] as List)
        .map((p) => ProductCardData.fromJson(p))
        .toList();

    // Filter out excluded variation if specified
    if (widget.excludeVariationId != null) {
      products = products.where((p) => p.id != widget.excludeVariationId).toList();
    }

    return products;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Products Horizontal List
        FutureBuilder<List<ProductCardData>>(
          future: _productsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(48.0),
                  child: CircularProgressIndicator(),
                ),
              );
            }
    
            if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(48.0),
                  child: Text(
                    'Error loading products',
                    style: AppTypography.bodyM.copyWith(color: AppColors.textSecondary),
                  ),
                ),
              );
            }
    
            final products = snapshot.data ?? [];
    
            if (products.isEmpty) {
              return SizedBox.shrink();
            }
    
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
          padding: const EdgeInsets.only(left: 16, right: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                widget.title,
                style: AppTypography.titleL.copyWith(
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
                SizedBox(
                  height: 300,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    itemCount: products.length,
                    separatorBuilder: (context, index) => const SizedBox(width: 12),
                    itemBuilder: (context, index) {
                      final product = products[index];
                      return SizedBox(
                        width: 140,
                        child: ProductCard(
                          id: product.id,
                          thumbnail: product.thumbnail,
                          brand: product.brand,
                          category: product.category,
                          title: product.title,
                          price: product.price,
                          compareAtPrice: product.compareAtPrice,
                          currencyCode: product.currencyCode,
                          currencySymbol: product.currencySymbol,
                          slug: product.slug,
                          isFavorited: widget.favoritedProducts.contains(product.id),
                          onFavoriteToggle: widget.onFavoriteToggle,
                          showLeftBorder: index == 0,
                          isBoosted: product.isBoosted,
                          showWeLoveBadge: product.showWeLoveBadge,
                          sellerId: product.sellerId,
                          totalStock: product.totalStock,
                        ),
                      );
                    },
                  ),
                ),
              ],
            );
          },
        ),
        // See All Button - only show if enabled and there are products
        if (widget.showSeeAll)
          FutureBuilder<List<ProductCardData>>(
            future: _productsFuture,
            builder: (context, snapshot) {
              final products = snapshot.data ?? [];
              if (products.isNotEmpty) {
                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: AppButton.outlined(
                        text: widget.seeAllText,
                        isFullWidth: true,
                        onPressed: () {
                          // Convert QueryType to filterType string
                          final filterType = switch (widget.queryType) {
                            QueryType.trending => 'trending',
                            QueryType.newArrivals => 'new-arrivals',
                            QueryType.featured => 'featured',
                            QueryType.weLove => 'we-love',
                            QueryType.recentlyViewed => 'recently-viewed',
                            QueryType.onSale => 'on-sale',
                          };

                          // Navigate to products screen with filters (using extra like shop screen does)
                          context.push(
                            '/discover/categories/products',
                            extra: {
                              'departmentId': widget.department,
                              'filterType': filterType,
                              'title': widget.title,
                            },
                          );
                        },
                      ),
                    ),
                  ],
                );
              }
              return const SizedBox.shrink();
            },
          ),
      ],
    );
  }
}

class ProductCardData {
  final String id;
  final String? thumbnail;
  final String? brand;
  final String? category;
  final String title;
  final double price;
  final double? compareAtPrice;
  final String currencyCode;
  final String currencySymbol;
  final String slug;
  final bool isBoosted;
  final bool showWeLoveBadge;
  final String? sellerId;
  final int? totalStock;

  ProductCardData({
    required this.id,
    this.thumbnail,
    this.brand,
    this.category,
    required this.title,
    required this.price,
    this.compareAtPrice,
    required this.currencyCode,
    required this.currencySymbol,
    required this.slug,
    this.isBoosted = false,
    this.showWeLoveBadge = false,
    this.sellerId,
    this.totalStock,
  });

  factory ProductCardData.fromJson(Map<String, dynamic> json) {
    // Use currency from variation if available, otherwise use global currency
    final currencyData = json['currency'];
    final currencyCode = currencyData?['code'] ?? CurrencyUtils.currentCode;
    final currencySymbol = currencyData?['symbol'] ?? CurrencyUtils.currentSymbol;
    
    return ProductCardData(
      id: json['id'],
      thumbnail: json['thumbnail'],
      brand: json['brand'],
      category: json['category'],
      title: json['title'],
      price: (json['sellingPrice'] as num?)?.toDouble() ?? (json['price'] as num?)?.toDouble() ?? 0,
      compareAtPrice: json['compareAtPrice'] != null
          ? (json['compareAtPrice'] as num).toDouble()
          : null,
      currencyCode: currencyCode,
      currencySymbol: currencySymbol,
      slug: json['slug'],
      isBoosted: json['isBoosted'] ?? false,
      showWeLoveBadge: json['showWeLoveBadge'] ?? false,
      sellerId: json['sellerId'],
      totalStock: json['totalStock'] as int?,
    );
  }
}
