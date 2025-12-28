import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/utilities/media_utils.dart';
import 'package:dres/features/product_details/data/models/product_details_model.dart';

class ProductImageCarousel extends StatefulWidget {
  final List<ImageModel> images;

  const ProductImageCarousel({
    super.key,
    required this.images,
  });

  @override
  State<ProductImageCarousel> createState() => _ProductImageCarouselState();
}

class _ProductImageCarouselState extends State<ProductImageCarousel> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.images.isEmpty) {
      return Container(
        width: double.infinity,
        height: 440,
        color: Colors.grey[200],
        child: const Center(
          child: Text('No Image'),
        ),
      );
    }

    return Column(
      children: [
        // Image PageView
        SizedBox(
          width: double.infinity,
          height: 440,
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() {
                _currentPage = index;
              });
            },
            itemCount: widget.images.length,
            itemBuilder: (context, index) {
              final image = widget.images[index];
              return Container(
                width: double.infinity,
                height: 440,
                decoration: BoxDecoration(
                  image: DecorationImage(
                    image: NetworkImage(
                      MediaUtils.resolveUrl(image.url) ?? '',
                    ),
                    fit: BoxFit.cover,
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 10),
        // Page Indicator Bars
        if (widget.images.length > 1)
          Container(
            height: 3,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: List.generate(
                widget.images.length,
                (index) => Expanded(
                  child: Container(
                    height: 3,
                    margin: EdgeInsets.only(
                      right: index < widget.images.length - 1 ? 5 : 0,
                    ),
                    color: _currentPage == index
                        ? AppColors.textPrimary
                        : AppColors.border,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
