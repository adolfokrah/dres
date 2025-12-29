import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/constants/app_images.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:dres/l10n/app_localizations.dart';

/// Reusable social sign-in buttons widget for auth screens
class SocialSignInButtons extends StatelessWidget {
  final bool isLoading;
  final bool outlined;
  final Color? backgroundColor;
  final Color? textColor;

  const SocialSignInButtons({
    super.key,
    this.isLoading = false,
    this.outlined = false,
    this.backgroundColor,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Column(
      children: [
        // Continue with Apple (iOS only)
        if (Platform.isIOS) ...[
          outlined
              ? AppButton.outlined(
                  text: l10n.continueWithApple,
                  onPressed: isLoading
                      ? null
                      : () {
                          context.read<AuthBloc>().add(const AuthAppleSignInRequested());
                        },
                  borderColor: AppColors.textPrimary,
                  textColor: textColor ?? AppColors.textPrimary,
                  icon: Image.asset(
                    AppImages.appleIcon,
                    height: 24,
                    width: 24,
                  ),
                  width: double.infinity,
                )
              : AppButton.filled(
                  text: l10n.continueWithApple,
                  onPressed: isLoading
                      ? null
                      : () {
                          context.read<AuthBloc>().add(const AuthAppleSignInRequested());
                        },
                  backgroundColor: backgroundColor ?? AppColors.background,
                  textColor: textColor ?? AppColors.textPrimary,
                  icon: Image.asset(
                    AppImages.appleIcon,
                    height: 24,
                    width: 24,
                  ),
                  width: double.infinity,
                ),
          const SizedBox(height: 12),
        ],

        // Continue with Google
        outlined
            ? AppButton.outlined(
                text: l10n.continueWithGoogle,
                onPressed: isLoading
                    ? null
                    : () {
                        context.read<AuthBloc>().add(const AuthGoogleSignInRequested());
                      },
                borderColor:  AppColors.textPrimary,
                textColor: textColor ?? AppColors.textPrimary,
                icon: Image.asset(
                  AppImages.googleIcon,
                  height: 24,
                  width: 24,
                ),
                width: double.infinity,
              )
            : AppButton.filled(
                text: l10n.continueWithGoogle,
                onPressed: isLoading
                    ? null
                    : () {
                        context.read<AuthBloc>().add(const AuthGoogleSignInRequested());
                      },
                backgroundColor: backgroundColor ?? AppColors.background,
                textColor: textColor ?? AppColors.textPrimary,
                icon: Image.asset(
                  AppImages.googleIcon,
                  height: 24,
                  width: 24,
                ),
                width: double.infinity,
              ),
      ],
    );
  }
}
