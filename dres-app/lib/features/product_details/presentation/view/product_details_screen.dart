import 'package:dres/core/widgets/simple_header.dart';
import 'package:dres/core/widgets/badge_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_header.dart';
import 'package:dres/core/utilities/media_utils.dart';
import 'package:dres/features/product_details/logic/product_details_bloc/product_details_bloc.dart';
import 'package:dres/features/product_details/logic/product_details_bloc/product_details_event.dart';
import 'package:dres/features/product_details/logic/product_details_bloc/product_details_state.dart';
import 'package:dres/features/product_details/presentation/widgets/product_image_carousel.dart';
import 'package:dres/features/product_details/presentation/widgets/variation_thumbnails.dart';
import 'package:dres/features/product_details/presentation/widgets/buyer_protection_fee.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

class ProductDetailsScreen extends StatefulWidget {
  final String id;
  final String? skuId;

  const ProductDetailsScreen({
    super.key,
    required this.id,
    this.skuId,
  });

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen> {
  @override
  void initState() {
    super.initState();
    // Fetch product details when screen loads
    context.read<ProductDetailsBloc>().add(
      FetchProductDetails(
        variationId: widget.id,
        skuId: widget.skuId,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: BlocBuilder<ProductDetailsBloc, ProductDetailsState>(
        builder: (context, state) {
          if (state.status == ProductDetailsStatus.loading) {
            return SafeArea(
              child: Column(
                children: [
                  SimpleHeader(
                    title: ''
                  ),
                  const Expanded(
                    child: Center(
                      child: CircularProgressIndicator(),
                    ),
                  ),
                ],
              ),
            );
          }

          if (state.status == ProductDetailsStatus.failure) {
            return SafeArea(
              child: Column(
                children: [
                  SimpleHeader(
                    title: '',
                  ),
                  Expanded(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Failed to load product',
                            style: AppTypography.bodyL,
                          ),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () {
                              context.read<ProductDetailsBloc>().add(
                                FetchProductDetails(
                                  variationId: widget.id,
                                  skuId: widget.skuId,
                                ),
                              );
                            },
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          }

          final variation = state.variation;
          if (variation == null) {
            return SafeArea(
              child: Column(
                children: [
                    SimpleHeader(
                    title: '',
                  ),
                  const Expanded(
                    child: Center(
                      child: Text('Product not found'),
                    ),
                  ),
                ],
              ),
            );
          }

          return SafeArea(
            child: Column(
              children: [
                // Header
                 SimpleHeader(
                    title: '',
                  ),

                // Content
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Main Image Carousel
                        ProductImageCarousel(
                          images: variation.images,
                        ),

                        // Product Info
                        Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Tags (Vintage, We Love)
                              if (variation.isBoosted)
                                const BadgeWidget(
                                  text: 'We Love',
                                ),
                              const SizedBox(height: 10),

                              // Brand and Actions
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    variation.brand,
                                    style: AppTypography.bodyL.copyWith(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 24
                                    ),
                                  ),
                                  Row(
                                    children: [
                                      PhosphorIcon(
                                        PhosphorIconsRegular.shareNetwork,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 20),
                                      PhosphorIcon(
                                        PhosphorIconsRegular.heart,
                                        size: 20,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),

                              // Title and Variations
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    variation.category,
                                    style: AppTypography.bodyL,
                                  ),
                                   const SizedBox(height: 5),
                                  Text(
                                    variation.variationsTitle != null
                                        ? '${variation.title} '
                                        : variation.title,
                                    style: AppTypography.bodyL,
                                  ),
                                   const SizedBox(height: 5),
                                  if (variation.variationsTitle != null)
                                   Row(
                                    children: [
                                       Text(
                                      '${variation.variationsTitle!.attribute}s: ',
                                      style: AppTypography.bodyL,
                                    ),
                                    if (variation.variationsTitle != null)
                                      Text(
                                        variation.variationsTitle!.values.join(', '),
                                        style: AppTypography.bodyL.copyWith(
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ]
                                   )
                                ],
                              ),
                              const SizedBox(height: 10),

                              // Related Variation Thumbnails (including current)
                              VariationThumbnails(
                                currentVariation: variation,
                                relatedVariations: state.relatedVariations,
                              ),
                              const SizedBox(height: 20),

                               if(variation.compareAtPrice != null)
                              Text(
                                'GHS ${variation.compareAtPrice!.toStringAsFixed(2)}',
                                style: AppTypography.bodyL.copyWith(
                                  decoration: TextDecoration.lineThrough,
                                  color: Colors.red,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 24
                                ),
                              ),
                              const SizedBox(height: 10),

                              // Price
                              Text(
                                'GHS ${variation.price.toStringAsFixed(2)}',
                                style: AppTypography.bodyL.copyWith(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 24
                                ),
                              ),
                              const SizedBox(height: 10),

                              // Buyer Protection Fee
                              BuyerProtectionFee(
                                fee: 35.00,
                              ),
                              const SizedBox(height: 10),

                              // TODO: Add size selector, add to bag button
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
