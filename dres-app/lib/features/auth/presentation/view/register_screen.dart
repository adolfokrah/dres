import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/widgets/webview_screen.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/app_text_field.dart';
import 'package:dres/core/widgets/app_password_field.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:dres/features/auth/presentation/widgets/social_sign_in_buttons.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_bloc.dart';
import 'package:dres/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _shopNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  bool _acceptMarketing = false;
  bool _acceptTerms = false;
  
  // Password validation states
  bool _hasMinLength = false;
  bool _hasNumber = false;
  bool _hasUpperAndLower = false;

  @override
  void initState() {
    super.initState();
    _passwordController.addListener(_validatePassword);
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _shopNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _validatePassword() {
    final password = _passwordController.text;
    setState(() {
      _hasMinLength = password.length >= 8;
      _hasNumber = password.contains(RegExp(r'[0-9]'));
      _hasUpperAndLower = password.contains(RegExp(r'[a-z]')) && 
                          password.contains(RegExp(r'[A-Z]'));
    });
  }

  String? _validateFirstName(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your first name';
    }
    return null;
  }

  String? _validateLastName(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your last name';
    }
    return null;
  }

  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your email';
    }
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email';
    }
    return null;
  }

  String? _validatePasswordField(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter a password';
    }
    if (!_hasMinLength || !_hasNumber || !_hasUpperAndLower) {
      return 'Password does not meet requirements';
    }
    return null;
  }

  void _handleRegister() {
    if (_formKey.currentState!.validate()) {
      if (!_acceptTerms) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please accept the terms and privacy policy'),
            backgroundColor: AppColors.error,
          ),
        );
        return;
      }
      
      context.read<AuthBloc>().add(AuthRegisterRequested(
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        shopName: _shopNameController.text.trim().isNotEmpty 
            ? _shopNameController.text.trim() 
            : null,
        email: _emailController.text.trim(),
        password: _passwordController.text,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state.status == AuthStatus.registrationSuccess) {
          // Registration successful - navigate to login page for email verification
          // Keep the redirectTo in bloc state for after login
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Registration successful! Please verify your email and log in.'),
              backgroundColor: AppColors.success,
            ),
          );
          context.go('/login');
        } else if (state.status == AuthStatus.authenticated) {
          // Social sign in successful - fetch user's cart
          context.read<CartBloc>().add(const CartFetchRequested());
          // Redirect to home
          final destination = state.redirectTo ?? '/home';
          context.read<AuthBloc>().add(const AuthClearRedirect());
          context.go(destination);
        } else if (state.status == AuthStatus.error) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.errorMessage ?? 'Registration failed'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      },
      builder: (context, state) {
        final isLoading = state.status == AuthStatus.loading;
        
        return Scaffold(
          backgroundColor: AppColors.surface,
          appBar: AppBar(
            backgroundColor: AppColors.surface,
            elevation: 0,
            leading: IconButton(
              icon: Icon(
                PhosphorIcons.caretLeft(),
                color: AppColors.textPrimary,
                size: 24,
              ),
              onPressed: () {
                if (context.canPop()) {
                  context.pop();
                }
              },
            ),
            title: Text(
              l10n.joinUs,
              style: AppTypography.titleL.copyWith(
                color: AppColors.textPrimary,
              ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // First name field
                AppTextField(
                  controller: _firstNameController,
                  label: l10n.firstName,
                  hintText: l10n.firstNameHint,
                  textCapitalization: TextCapitalization.words,
                  validator: _validateFirstName,
                ),

                const SizedBox(height: 20),

                // Last name field
                AppTextField(
                  controller: _lastNameController,
                  label: l10n.lastName,
                  hintText: l10n.lastNameHint,
                  textCapitalization: TextCapitalization.words,
                  validator: _validateLastName,
                ),

                const SizedBox(height: 20),

                // Shop name field (optional)
                AppTextField(
                  controller: _shopNameController,
                  label: l10n.shopName,
                  hintText: l10n.shopNameHint,
                  textCapitalization: TextCapitalization.words,
                ),

                const SizedBox(height: 20),

                // Email field
                AppTextField(
                  controller: _emailController,
                  label: l10n.email,
                  hintText: l10n.enterYourEmail,
                  keyboardType: TextInputType.emailAddress,
                  validator: _validateEmail,
                ),

                const SizedBox(height: 20),

                // Password field
                AppPasswordField(
                  controller: _passwordController,
                  label: l10n.password,
                  hintText: l10n.enterYourPassword,
                  validator: _validatePasswordField,
                ),

                const SizedBox(height: 16),

                // Password requirements
                _buildPasswordRequirement(
                  l10n.atLeast8Characters,
                  _hasMinLength,
                ),
                const SizedBox(height: 8),
                _buildPasswordRequirement(
                  l10n.atLeast1Number,
                  _hasNumber,
                ),
                const SizedBox(height: 8),
                _buildPasswordRequirement(
                  l10n.upperAndLowerCase,
                  _hasUpperAndLower,
                ),

                const SizedBox(height: 24),

                // Marketing consent
                _buildToggleRow(
                  l10n.marketingConsent,
                  _acceptMarketing,
                  (value) => setState(() => _acceptMarketing = value),
                ),

                const SizedBox(height: 16),

                // Terms acceptance
                _buildTermsRow(l10n),

                const SizedBox(height: 24),

                // Register button
                AppButton.filled(
                  text: l10n.joinUsButton,
                  onPressed: (_acceptTerms && !isLoading) ? _handleRegister : null,
                  isLoading: isLoading,
                ),

                const SizedBox(height: 32),

                // Or divider
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 1,
                        color: AppColors.border,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        l10n.or,
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                    Expanded(
                      child: Container(
                        height: 1,
                        color: AppColors.border,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 32),

                // Social Sign In Buttons
                SocialSignInButtons(
                  isLoading: isLoading,
                  outlined: true,
                ),

                const SizedBox(height: 32),

                // Already a member
                Center(
                  child: TextButton(
                    onPressed: () {
                      context.push('/login');
                    },
                    child: Text(
                      l10n.alreadyMember,
                      style: AppTypography.bodyM.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
      },
    );
  }

  Widget _buildPasswordRequirement(String text, bool isMet) {
    return Row(
      children: [
        Icon(
          isMet ? PhosphorIcons.checkCircle() : PhosphorIcons.xCircle(),
          size: 18,
          color: isMet ? AppColors.success : AppColors.textSecondary,
        ),
        const SizedBox(width: 8),
        Text(
          text,
          style: AppTypography.bodyM.copyWith(
            color: isMet ? AppColors.textPrimary : AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildToggleRow(String text, bool value, ValueChanged<bool> onChanged) {
    return Row(
      children: [
        Expanded(
          child: Text(
            text,
            style: AppTypography.bodyM.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
        ),
        Switch(
          value: value,
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _buildTermsRow(AppLocalizations l10n) {
    return Row(
      children: [
        Expanded(
          child: RichText(
            text: TextSpan(
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textPrimary,
              ),
              children: [
                TextSpan(text: l10n.iAcceptThe),
                TextSpan(
                  text: l10n.terms,
                  style: const TextStyle(
                    decoration: TextDecoration.underline,
                  ),
                  recognizer: TapGestureRecognizer()
                    ..onTap = () {
                      openWebViewScreen(
                        context,
                        url: 'https://dres.app/terms-of-service',
                        title: l10n.termsOfService,
                      );
                    },
                ),
                TextSpan(text: l10n.andIHaveReadThe),
                TextSpan(
                  text: l10n.privacyPolicyCookies,
                  style: const TextStyle(
                    decoration: TextDecoration.underline,
                  ),
                  recognizer: TapGestureRecognizer()
                    ..onTap = () {
                      openWebViewScreen(
                        context,
                        url: 'https://dres.app/privacy-policy',
                        title: l10n.privacyPolicy,
                      );
                    },
                ),
              ],
            ),
          ),
        ),
        Switch(
          value: _acceptTerms,
          onChanged: (value) => setState(() => _acceptTerms = value),
        ),
      ],
    );
  }
}
