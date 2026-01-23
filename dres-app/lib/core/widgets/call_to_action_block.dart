import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../theme/app_typography.dart';
import '../utilities/media_utils.dart';
import '../services/storage_service.dart';
import '../di/injection.dart';

class CallToActionBlock extends StatelessWidget {
  final String? imageUrl;
  final String title;
  final String buttonText;
  final String buttonLink;
  final VoidCallback? onDepartmentChanged;

  const CallToActionBlock({
    super.key,
    this.imageUrl,
    required this.title,
    required this.buttonText,
    required this.buttonLink,
    this.onDepartmentChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.black,
        ),
        child: Row(
          children: [
            // Left: Image
            if (imageUrl != null)
              Container(
                width: 128,
                height: 172,
                decoration: BoxDecoration(
                  image: DecorationImage(
                    image: NetworkImage(
                      MediaUtils.resolveUrl(imageUrl) ?? '',
                    ),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            
            // Right: Content with Black Background
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 32,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      title,
                      style: AppTypography.titleXL.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w400,
                        fontSize: 29
                      ),
                    ),
                    const SizedBox(height: 14),
                    
                    // Button
                    GestureDetector(
                      onTap: () async {
                        // Toggle department based on current preference
                        final storageService = getIt<StorageService>();
                        final currentDepartment = storageService.getUserDepartment();
                        
                        // Toggle between men and women (default to men if not set)
                        String newDepartment;
                        if (currentDepartment == 'men' || currentDepartment == null) {
                          newDepartment = 'women';
                        } else {
                          newDepartment = 'men';
                        }
                        
                        // Save new department
                        await storageService.setUserDepartment(newDepartment);
                        
                        // Trigger navigation via callback
                        // The parent will handle the actual navigation
                        onDepartmentChanged?.call();
                      },
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            buttonText,
                            style: AppTypography.bodyL.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 19
                            ),
                          ),
                          const SizedBox(width: 8),
                          PhosphorIcon(
                            PhosphorIconsRegular.arrowRight,
                            color: Colors.white,
                            size: 16,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
