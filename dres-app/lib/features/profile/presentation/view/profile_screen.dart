import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/services/storage_service.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/widgets/profile_avatar.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:dres/features/auth/data/models/auth_models.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_bloc.dart';
import 'package:dres/features/cart/logic/cart_bloc/cart_event.dart';
import 'package:dres/features/home/logic/bloc/home_bloc.dart';
import 'package:dres/features/home/logic/bloc/home_event.dart';
import 'package:dres/l10n/app_localizations.dart';
import 'package:dres/core/widgets/shopping_preference_sheet.dart';
import 'package:go_router/go_router.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late StorageService _storageService;

  @override
  void initState() {
    super.initState();
    _storageService = getIt<StorageService>();
    // Fetch current user data when screen loads
    context.read<AuthBloc>().add(const AuthCheckStatusRequested());
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            UnifiedHeader.titleWithBell(
              title: l10n.me
            ),

            // Body content
            Expanded(
              child: BlocConsumer<AuthBloc, AuthState>(
                listener: (context, state) {
                  if (state.status == AuthStatus.unauthenticated) {
                    context.go('/auth');
                  }
                },
                builder: (context, state) {
                  final user = state.user;

                  return SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Profile Header
                        _buildProfileHeader(context, user, l10n),

                        // Personal Info Section
                        _buildSectionHeader(l10n.personalInfo.toUpperCase()),
                        
                        _buildMenuItem(
                          title: l10n.personalInfo,
                          onTap: () {
                            context.push('/profile/personal-info');
                          },
                        ),

                        // Account Preference Section
                        _buildSectionHeader(l10n.accountPreference),

                        ValueListenableBuilder<String>(
                          valueListenable: _storageService.departmentNotifier,
                          builder: (context, department, child) {
                            return _buildMenuItemWithValue(
                              title: l10n.shoppingPreference,
                              value: department == 'women'
                                  ? l10n.women
                                  : l10n.men,
                              onTap: () => _showShoppingPreferenceSheet(department),
                            );
                          },
                        ),

                        _buildMenuItem(
                          title: l10n.vacationMode,
                          onTap: () {
                            context.pushNamed('vacation-mode');
                          },
                        ),

                        _buildMenuItem(
                          title: l10n.savedSearches,
                          onTap: () {
                            context.push('/saved-searches');
                          },
                        ),

                        _buildMenuItem(
                          title: l10n.withdrawalAccount,
                          onTap: () {
                            context.push('/profile/withdrawal-account');
                          },
                        ),

                        _buildMenuItem(
                          title: 'Shipping Rates',
                          onTap: () {
                            context.push('/profile/shipping-rates');
                          },
                        ),

                        // Info Section
                        _buildSectionHeader(l10n.info),

                        _buildMenuItem(
                          title: l10n.privacyPolicy,
                          onTap: () async {
                            final uri = Uri.parse('https://dres.app/privacy-policy');
                            if (await canLaunchUrl(uri)) {
                              await launchUrl(uri, mode: LaunchMode.externalApplication);
                            }
                          },
                        ),

                        _buildMenuItem(
                          title: l10n.termsOfService,
                          onTap: () async {
                            final uri = Uri.parse('https://dres.app/terms-of-service');
                            if (await canLaunchUrl(uri)) {
                              await launchUrl(uri, mode: LaunchMode.externalApplication);
                            }
                          },
                        ),

                        // Empty Section (spacer)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                            vertical: 25,
                            horizontal: 20,
                          ),
                          color: AppColors.secondary,
                        ),

                        // Logout
                        _buildMenuItem(
                          title: l10n.logout,
                          onTap: () {
                            _showLogoutDialog(context, l10n);
                          },
                        ),

                        const SizedBox(height: 20),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showShoppingPreferenceSheet(String currentPreference) async {
    final selected = await ShoppingPreferenceSheet.show(
      context,
      currentPreference: currentPreference,
    );

    if (selected != null && selected != currentPreference) {
      await _storageService.setUserDepartment(selected);

      // Refresh home page with new department's page slug
      if (mounted) {
        final pageSlug = selected == 'women' ? 'home-women' : 'home';
        context.read<HomeBloc>().add(RefreshHomePage(slug: pageSlug));
      }
    }
  }

  Widget _buildProfileHeader(
    BuildContext context,
    AuthUser? user,
    AppLocalizations l10n,
  ) {
    // Display shop name if available, otherwise full name
    final displayName = user?.shopName?.isNotEmpty == true
        ? user!.shopName!
        : user?.fullName ?? '';

    // Get photo URL
    final photoUrl = user?.photo;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.secondary, width: 1),
        ),
      ),
      child: Row(
        children: [
          // Profile Image
          ProfileAvatar(
            photoUrl: photoUrl,
            displayName: user?.fullName ?? '',
            size: 70,
          ),
          const SizedBox(width: 20),
          // Profile Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  displayName,
                  style: AppTypography.titleL.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                GestureDetector(
                  onTap: () {
                    context.push('/profile/user');
                  },
                  child: Text(
                    l10n.viewProfile,
                    style: AppTypography.bodyM.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 25, 20, 10),
      color: AppColors.secondary,
      child: Text(
        title.toUpperCase(),
        style: AppTypography.bodyL.copyWith(color: AppColors.textPrimary),
      ),
    );
  }

  Widget _buildMenuItem({required String title, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(color: AppColors.secondary, width: 1),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: AppTypography.bodyL.copyWith(color: AppColors.textPrimary),
            ),
            Icon(
              PhosphorIcons.caretRight(),
              color: AppColors.textPrimary,
              size: 16,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItemWithValue({
    required String title,
    required String value,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(color: AppColors.secondary, width: 1),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: AppTypography.bodyL.copyWith(color: AppColors.textPrimary),
            ),
            Row(
              children: [
                Text(
                  value,
                  style: AppTypography.bodyL.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(width: 5),
                Icon(
                  PhosphorIcons.caretRight(),
                  color: AppColors.textPrimary,
                  size: 16,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
          backgroundColor: AppColors.surface,
          title: Text(
            l10n.logout,
            style: AppTypography.titleLM.copyWith(color: AppColors.textPrimary),
          ),
          content: Text(
            l10n.logoutConfirmation,
            style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
              },
              child: Text(
                l10n.cancel,
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                // Clear cart on logout
                context.read<CartBloc>().add(const CartCleared());
                context.read<AuthBloc>().add(const AuthLogoutRequested());
              },
              child: Text(
                l10n.logout,
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.error,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
