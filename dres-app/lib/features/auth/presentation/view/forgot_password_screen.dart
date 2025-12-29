import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/app_text_field.dart';
import 'package:dres/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isSubmitted = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
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

  void _handleSubmit() {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isSubmitted = true;
      });
      // TODO: Implement forgot password API call
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

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
          l10n.forgotPasswordTitle,
          style: AppTypography.titleL.copyWith(
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: _isSubmitted ? _buildSuccessView(l10n) : _buildFormView(l10n),
        ),
      ),
    );
  }

  Widget _buildFormView(AppLocalizations l10n) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 20),

          // Description
          Text(
            l10n.forgotPasswordDescription,
            style: AppTypography.bodyL.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 32),

          // Email field
          AppTextField(
            controller: _emailController,
            label: l10n.email,
            hintText: l10n.enterYourEmail,
            keyboardType: TextInputType.emailAddress,
            validator: _validateEmail,
          ),

          const SizedBox(height: 32),

          // Submit button
          AppButton.filled(
            text: l10n.sendResetLink,
            onPressed: _handleSubmit,
          ),

          const SizedBox(height: 24),

          // Back to login
          Center(
            child: TextButton(
              onPressed: () {
                if (context.canPop()) {
                  context.pop();
                }
              },
              child: Text(
                l10n.backToLogin,
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessView(AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 40),

        // Success icon
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppColors.success.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.check,
            size: 40,
            color: AppColors.success,
          ),
        ),

        const SizedBox(height: 24),

        // Success title
        Text(
          l10n.checkYourEmail,
          style: AppTypography.titleL.copyWith(
            color: AppColors.textPrimary,
          ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 16),

        // Success description
        Text(
          l10n.resetLinkSent(_emailController.text),
          style: AppTypography.bodyL.copyWith(
            color: AppColors.textSecondary,
          ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 32),

        // Back to login button
        AppButton.filled(
          text: l10n.backToLogin,
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            }
          },
        ),

        const SizedBox(height: 24),

        // Resend link
        Center(
          child: TextButton(
            onPressed: () {
              setState(() {
                _isSubmitted = false;
              });
            },
            child: Text(
              l10n.didntReceiveEmail,
              style: AppTypography.bodyM.copyWith(
                color: AppColors.textSecondary,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
