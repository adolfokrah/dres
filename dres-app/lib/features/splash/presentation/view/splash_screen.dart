import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/constants/app_images.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/l10n/app_localizations.dart';
import 'package:dres/routes.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_bloc.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_state.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigateToHome();
  }

  Future<void> _navigateToHome() async {
    // Wait a brief moment to ensure bloc is ready
    await Future.delayed(const Duration(milliseconds: 100));
    
    if (!mounted) return;
    
    // Wait for menu to load successfully before navigating
    final menuBloc = context.read<MenuBloc>();
    
    // If already loaded, navigate immediately
    if (menuBloc.state.status == MenuStatus.success) {
      if (mounted) {
        _navigateToDestination();
      }
      return;
    }
    
    // Otherwise wait for success state
    await menuBloc.stream.firstWhere(
      (state) => state.status == MenuStatus.success || state.status == MenuStatus.failure,
    );
    
    if (mounted) {
      _navigateToDestination();
    }
  }
  
  void _navigateToDestination() {
    // Check for pending deep link
    final pendingDeepLink = AppRoutes.pendingDeepLink;
    if (pendingDeepLink != null) {
      // Clear the pending deep link
      AppRoutes.pendingDeepLink = null;
      // First go to home to initialize the shell, then push the deep link
      context.go(AppRoutes.home);
      // Use Future.microtask to ensure home is rendered first
      Future.microtask(() {
        if (mounted) {
          context.push(pendingDeepLink);
        }
      });
    } else {
      // Normal navigation to home
      context.go(AppRoutes.home);
    }
  }

  @override
  Widget build(BuildContext context) {
    final translation = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Main content - centered logo and tagline
            Expanded(
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Logo
                    Image.asset(
                      AppImages.fullLogo,
                      width: 200,
                      fit: BoxFit.contain,
                    ),
                    const SizedBox(height: 1),
                    // Tagline
                    Text(
                      translation.splashTagline,
                      style: AppTypography.bodyL.copyWith(
                        color: AppColors.textPrimary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
            // Loading indicator at bottom
            Padding(
              padding: const EdgeInsets.only(bottom: 60),
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
