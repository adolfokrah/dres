import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_info_banner.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

class PhotoTipsScreen extends StatelessWidget {
  const PhotoTipsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: PhosphorIcon(
            PhosphorIconsRegular.x,
            color: AppColors.textPrimary,
            size: 24,
          ),
        ),
        title: Text(
          'Tips for taking photos',
          style: AppTypography.bodyL.copyWith(
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section 1: Main photo
            _buildSection(
              context,
              number: '1',
              title: 'Main photo',
              description: 'On a contrasting background, take photos of everything you\'ll ship. (All photos must be your own)',
              explanation: 'Why? A great main photo will attract more buyers, and also speed up the publication of your listing.',
              examples: [
                _buildExampleRow(
                  context,
                  imageAsset: 'assets/images/photo-tips/main_photo.png',
                ),
              ],
            ),
            
            const SizedBox(height: 32),
            
            // Section 2: Label photos
            _buildSection(
              context,
              number: '2',
              title: 'Label photo(s)',
              description: 'Clearly showing the item\'s label(s) will speed up the authentication process.',
              explanation: 'Why? Including these means we can authenticate your item more quickly.',
              examples: [
                _buildExampleRow(
                  context,
                  imageAsset: 'assets/images/photo-tips/label_photo.png',
                ),
              ],
            ),
            
            const SizedBox(height: 32),
            
            // Section 3: More photos
            _buildSection(
              context,
              number: '3',
              title: 'The more photos, the better!',
              description: 'Add up to 15 photos. Include the full view, details, and the item being worn.',
              explanation: 'Why? More detail means fewer questions from buyers, and faster sales.',
              examples: [
                _buildExampleRow(
                  context,
                  imageAsset: 'assets/images/photo-tips/multiple_photos.png',
                ),
              ],
            ),
            
            const SizedBox(height: 32),
            
            // Section 4: Packaging
            _buildSection(
              context,
              number: '4',
              title: 'Packaging photo(s)',
              description: 'Showing any original packaging you have (i.e. boxes and dust bags) increases your item\'s desirability.',
              explanation: 'Why? Packaging increases the selling price of your item, and helps us with authentication too.',
              examples: [
                _buildExampleRow(
                  context,
                  imageAsset: 'assets/images/photo-tips/packaging.png',
                ),
              ],
            ),
            
            const SizedBox(height: 32),
            
            // Section 5: Show flaws
            _buildSection(
              context,
              number: '5',
              title: 'Show the flaws',
              description: 'Include clear photographs of any imperfections. Honesty is the best policy and returns will be less likely.',
              explanation: 'Why? Being honest here means satisfied buyers and less chance of your item being rejected or re-priced later.',
              examples: [
                _buildExampleRow(
                  context,
                  imageAsset: 'assets/images/photo-tips/flaws.png',
                ),
              ],
            ),
            
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(
    BuildContext context, {
    required String number,
    required String title,
    required String description,
    required String explanation,
    required List<Widget> examples,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section header
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  number,
                  style: AppTypography.bodyL.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTypography.titleL.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    description,
                    style: AppTypography.bodyL.copyWith(
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 16),
        
        // Examples
        ...examples,
        
        const SizedBox(height: 16),
        
        // Explanation
        AppInfoBanner(
          text: explanation,
        ),
      ],
    );
  }

  Widget _buildExampleRow(
    BuildContext context, {
    required String imageAsset,
  }) {
    return _buildExampleCard(
      context,
      imageAsset: imageAsset,
    );
  }

  Widget _buildExampleCard(
    BuildContext context, {
    required String imageAsset,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.background,
      ),
      child: SizedBox(
        width: double.infinity,
        height: 220,
        child: ClipRRect(
          child: Image.asset(
            imageAsset,
            width: double.infinity,
            height: 120,
            fit: BoxFit.contain,
            errorBuilder: (context, error, stackTrace) {
              // Fallback to placeholder icon if image fails to load
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    PhosphorIcon(
                      PhosphorIconsRegular.image,
                      size: 32,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Image not found',
                      style: AppTypography.bodyS.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}