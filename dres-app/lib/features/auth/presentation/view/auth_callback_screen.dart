import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:dres/core/theme/app_colors.dart';

/// A screen that handles Firebase OAuth callback and redirects once authenticated
class AuthCallbackScreen extends StatelessWidget {
  const AuthCallbackScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listenWhen: (previous, current) => previous.status != current.status,
      listener: (context, state) {
        if (state.status == AuthStatus.authenticated) {
          final destination = state.redirectTo ?? '/home';
          context.read<AuthBloc>().add(const AuthClearRedirect());
          context.go(destination);
        } else if (state.status == AuthStatus.error) {
          // Go back to auth screen on error
          context.go('/auth');
        } else if (state.status == AuthStatus.initial) {
          // If auth was cancelled, go back to auth screen
          context.go('/auth');
        }
      },
      child: const Scaffold(
        backgroundColor: AppColors.surface,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(
                color: AppColors.primary,
              ),
              SizedBox(height: 16),
              Text(
                'Completing sign in...',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
