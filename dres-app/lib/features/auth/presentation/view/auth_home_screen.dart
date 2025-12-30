import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/constants/app_images.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:dres/features/auth/presentation/widgets/social_sign_in_buttons.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_bloc.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_event.dart';
import 'package:dres/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class AuthHomeScreen extends StatelessWidget {
  const AuthHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return BlocConsumer<AuthBloc, AuthState>(
      listenWhen: (previous, current) => previous.status != current.status,
      listener: (context, state) {
        if (state.status == AuthStatus.authenticated) {
          // Social sign in successful - fetch user's cart
          context.read<CartBloc>().add(const CartFetchRequested());
          // Redirect
          final destination = state.redirectTo ?? '/home';
          context.read<AuthBloc>().add(const AuthClearRedirect());
          context.go(destination);
        } else if (state.status == AuthStatus.error) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.errorMessage ?? 'Sign in failed'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      },
      builder: (context, state) {
        final isLoading = state.status == AuthStatus.loading;

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
              
              // Loading overlay
              if (isLoading)
                Container(
                  color: Colors.black.withValues(alpha: 0.5),
                  child: const Center(
                    child: CircularProgressIndicator(
                      color: AppColors.textOnPrimary,
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
                            color: Colors.black.withValues(alpha: 0.5),
                            shape: BoxShape.circle,
                          ),
                          child: IconButton(
                            icon: const Icon(
                              Icons.close,
                              color: AppColors.textOnPrimary,
                              size: 24,
                            ),
                            onPressed: isLoading ? null : () {
                              if (context.canPop()) {
                                context.pop();
                              } else {
                                context.go('/home');
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
                      
                      // Social Sign In Buttons
                      const SocialSignInButtons(),
                      
                      const SizedBox(height: 16),
                      
                      // Register with Email
                      AppButton.outlined(
                        text: l10n.registerWithEmail,
                        onPressed: isLoading ? null : () {
                          context.push('/register');
                        },
                        borderColor: AppColors.textOnPrimary,
                        textColor: AppColors.textOnPrimary,
                        width: double.infinity,
                      ),
                      
                      const SizedBox(height: 24),
                      
                      // Already have account
                      TextButton(
                        onPressed: isLoading ? null : () {
                          context.push('/login');
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
      },
    );
  }
}
