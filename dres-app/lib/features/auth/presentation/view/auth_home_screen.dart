import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/constants/app_images.dart';
import 'package:dres/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class AuthHomeScreen extends StatelessWidget {
  const AuthHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Background Image
          Image.asset(
            AppImages.authHome,
            fit: BoxFit.cover,
          ),
          
          // Dark overlay - gradient from black to transparent
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [
                  Colors.black,
                  Colors.transparent,
                ],
              ),
            ),
          ),
          
          // Content
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Column(
                children: [
                  // Close button at top left
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        icon: const Icon(
                          Icons.close,
                          color: AppColors.textOnPrimary,
                          size: 24,
                        ),
                        onPressed: () {
                          if (context.canPop()) {
                            context.pop();
                          }
                        },
                      ),
                    ),
                  ),
                  
                  const Spacer(),
                  
                  // Title and subtitle
                  Column(
                    children: [
                      Image.asset(
                    AppImages.fullLogoWhite,
                    height: 40,
                  ),
                  const SizedBox(height: 16),
                      Text(
                        l10n.registerDiscount,
                        style: AppTypography.bodyL.copyWith(
                          color: AppColors.textOnPrimary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 40),
                  
                  // Continue with Apple
                  AppButton.filled(
                    text: l10n.continueWithApple,
                    onPressed: () {
                      // TODO: Implement Apple Sign In
                    },
                    backgroundColor: AppColors.background,
                    textColor: AppColors.textPrimary,
                    icon: Image.asset(
                      AppImages.appleIcon,
                      height: 24,
                      width: 24,
                    ),
                    width: double.infinity,
                  ),
                  
                  const SizedBox(height: 12),
                  
                  // Continue with Google
                  AppButton.filled(
                    text: l10n.continueWithGoogle,
                    onPressed: () {
                      // TODO: Implement Google Sign In
                    },
                    backgroundColor: AppColors.background,
                    textColor: AppColors.textPrimary,
                    icon: Image.asset(
                      AppImages.googleIcon,
                      height: 24,
                      width: 24,
                    ),
                    width: double.infinity,
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Register with Email
                  AppButton.outlined(
                    text: l10n.registerWithEmail,
                    onPressed: () {
                      // TODO: Navigate to email registration
                    },
                    borderColor: AppColors.textOnPrimary,
                    textColor: AppColors.textOnPrimary,
                    width: double.infinity,
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Already have account
                  TextButton(
                    onPressed: () {
                      // TODO: Navigate to login
                    },
                    child: Text(
                      l10n.alreadyHaveAccount,
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textOnPrimary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  
                 
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
