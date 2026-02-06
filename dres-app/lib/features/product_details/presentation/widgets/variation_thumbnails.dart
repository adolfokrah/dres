import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/utilities/media_utils.dart';
import 'package:dres/features/product_details/data/models/product_details_model.dart';
import 'package:dres/features/product_details/logic/product_details_bloc/product_details_bloc.dart';
import 'package:dres/features/product_details/logic/product_details_bloc/product_details_event.dart';

class VariationThumbnails extends StatelessWidget {
  final VariationDetailsModel currentVariation;
  final List<RelatedVariationModel> relatedVariations;

  const VariationThumbnails({
    super.key,
    required this.currentVariation,
    required this.relatedVariations,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 117,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: relatedVariations.length + 1,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          // First item is current variation
          if (index == 0) {
            return Container(
              width: 84,
              height: 117,
              decoration: BoxDecoration(
                border: Border.all(
                  color: AppColors.textPrimary,
                  width: 1,
                ),
                image: DecorationImage(
                  image: NetworkImage(
                    MediaUtils.resolveUrl(currentVariation.thumbnail) ?? '',
                  ),
                  fit: BoxFit.cover,
                ),
              ),
            );
          }

          // Related variations
          final related = relatedVariations[index - 1];
          return GestureDetector(
            onTap: () {
              // Navigate to related variation
              context.read<ProductDetailsBloc>().add(
                    FetchProductDetails(
                      variationId: related.id,
                      skuId: related.defaultSku,
                    ),
                  );
            },
            child: Container(
              width: 84,
              height: 117,
              decoration: BoxDecoration(
                border: Border.all(
                  color: Colors.transparent,
                ),
                image: DecorationImage(
                  image: NetworkImage(
                    MediaUtils.resolveUrl(related.thumbnail) ?? '',
                  ),
                  fit: BoxFit.cover,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
