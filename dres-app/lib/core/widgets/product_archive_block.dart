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

enum QueryType { trending, newArrivals, recentlyViewed, featured }

class ProductArchiveBlock extends StatefulWidget {
  final String title;
  final QueryType queryType;
  final bool showSeeAll;
  final String seeAllText;
  final String? department;
  final int limit;
  final Function(String id, bool isFavorited)? onFavoriteToggle;
  final Set<String> favoritedProducts;

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

  Future<List<ProductCardData>> _fetchProducts() async {
    final departmentId = widget.department ?? '694eee871a36e6d75fbb15af';
    final apiService = getIt<ApiService>();
    
    String endpoint;
    if (widget.queryType == QueryType.trending) {
      endpoint = trendingVariations;
    } else if (widget.queryType == QueryType.newArrivals) {
      endpoint = newArrivals;
    } else if (widget.queryType == QueryType.featured) {
      endpoint = featuredVariations;
    } else if (widget.queryType == QueryType.recentlyViewed) {
      endpoint = recentlyViewedVariations;
    } else {
      return [];
    }
    
    final queryParams = <String, dynamic>{
      'limit': widget.limit,
      'department': departmentId,
    };
    
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
    
    return (response.data['docs'] as List)
        .map((p) => ProductCardData.fromJson(p))
        .toList();
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
          padding: const EdgeInsets.only(left: 16, right: 16, top: 24, bottom: 0),
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
                  height: 450,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    itemCount: products.length,
                    itemBuilder: (context, index) {
                      final product = products[index];
                      return SizedBox(
                        width: 200,
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
                    const SizedBox(height: 24),
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
                            QueryType.recentlyViewed => 'recently-viewed',
                          };
                          
                          // Build query parameters
                          final queryParams = <String, String>{
                            'title': widget.title,
                            'filterType': filterType,
                          };
                          if (widget.department != null) {
                            queryParams['department'] = widget.department!;
                          }
                          
                          // Build the URL with query params
                          final queryString = queryParams.entries
                              .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
                              .join('&');
                          
                          // Navigate to products screen with filters
                          context.push('/discover/categories/products?$queryString');
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
      sellerId: json['sellerId'],
      totalStock: json['totalStock'] as int?,
    );
  }
}
