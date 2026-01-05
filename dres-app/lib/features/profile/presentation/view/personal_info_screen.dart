import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/widgets/profile_avatar.dart';
import 'package:dres/core/widgets/app_text_field.dart';
import 'package:dres/core/widgets/restart_widget.dart';
import 'package:dres/core/utilities/image_picker_utils.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:dres/features/auth/data/models/auth_models.dart';
import 'package:dres/features/auth/data/repositories/auth_repository.dart';
import 'package:dres/core/widgets/country_picker_sheet.dart';

/// Personal Info screen for viewing and editing user profile information
class PersonalInfoScreen extends StatefulWidget {
  const PersonalInfoScreen({super.key});

  @override
  State<PersonalInfoScreen> createState() => _PersonalInfoScreenState();
}

class _PersonalInfoScreenState extends State<PersonalInfoScreen> {
  bool _initialized = false;

  @override
  Widget build(BuildContext context) {
    // Refresh user data when screen loads (once)
    if (!_initialized) {
      _initialized = true;
      context.read<AuthBloc>().add(const AuthCheckStatusRequested());
    }
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: Icon(PhosphorIcons.caretLeft(), color: AppColors.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Personal Info',
          style: AppTypography.bodyL.copyWith(color: AppColors.textPrimary),
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: AppColors.secondary,
            height: 1,
          ),
        ),
      ),
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state.status == AuthStatus.error && state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: AppColors.error,
              ),
            );
          }
          // Show success message for email update
          if (state.status == AuthStatus.authenticated && 
              state.errorMessage != null &&
              state.errorMessage!.contains('verification')) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: Colors.green,
                duration: const Duration(seconds: 5),
              ),
            );
          }
          if (state.status == AuthStatus.unauthenticated) {
            // Account deleted, navigate to auth
            context.go('/auth');
          }
        },
        builder: (context, state) {
          final user = state.user;

          if (user == null || state.status == AuthStatus.loading) {
            return const Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // PERSONAL INFO Section
                _buildSectionHeader('PERSONAL INFO'),

                // Photo
                _buildPhotoItem(user),

                // Username (auto-generated, not editable)
                _buildInfoItem(
                  label: 'Username',
                  value: user.username != null ? '@${user.username}' : '',
                  showChevron: false,
                ),

                // First name
                _buildInfoItem(
                  label: 'First name',
                  value: user.firstName,
                  onTap: () => _showEditBottomSheet(
                    context,
                    title: 'Edit First Name',
                    fieldName: 'firstName',
                    currentValue: user.firstName,
                    hint: 'Enter your first name',
                  ),
                ),

                // Last name
                _buildInfoItem(
                  label: 'Last name',
                  value: user.lastName,
                  onTap: () => _showEditBottomSheet(
                    context,
                    title: 'Edit Last Name',
                    fieldName: 'lastName',
                    currentValue: user.lastName,
                    hint: 'Enter your last name',
                  ),
                ),

                // Shop name (with thicker bottom border)
                _buildInfoItem(
                  label: 'Shop name',
                  value: user.shopName ?? '',
                  thickBorder: true,
                  onTap: () => _showEditBottomSheet(
                    context,
                    title: 'Edit Shop Name',
                    fieldName: 'shopName',
                    currentValue: user.shopName ?? '',
                    hint: 'Enter your shop name',
                  ),
                ),

                // ACCOUNT INFO Section
                _buildSectionHeader('ACCOUNT INFO'),

                // Email (editable with verification)
                _buildInfoItem(
                  label: 'Email',
                  value: user.email,
                  thickBorder: true,
                  showChevron: true,
                  onTap: () => _showEmailEditBottomSheet(context, user.email),
                ),

                // INTERNATION INFO Section
                _buildSectionHeader('INTERNATION INFO'),

                // Language
                _buildInfoItem(
                  label: 'Language',
                  value: _getLanguageDisplayName(user.language),
                  showChevron: true,
                  onTap: () => _showLanguageSelector(context, user.language),
                ),

                // Currency (read-only, determined by country)
                _buildInfoItem(
                  label: 'Currency',
                  value: user.country?.currency?.code ?? '-',
                  showChevron: false,
                ),

                // Country
                _buildInfoItem(
                  label: 'Country',
                  value: user.country?.name ?? '-',
                  showChevron: true,
                  onTap: () => _showCountrySelector(context),
                ),

                // DELETE ACCOUNT
                _buildDeleteAccountButton(),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 25, 20, 10),
      color: AppColors.secondary,
      child: Text(
        title,
        style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
      ),
    );
  }

  Widget _buildPhotoItem(AuthUser user) {
    return InkWell(
      onTap: () => _pickProfilePhoto(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(color: AppColors.secondary, width: 1),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Photo',
              style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
            ),
            ProfileAvatar(
              photoUrl: user.photo,
              displayName: user.fullName,
              size: 35,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem({
    required String label,
    required String value,
    bool thickBorder = false,
    bool showChevron = false,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: AppColors.secondary,
              width: thickBorder ? 10 : 1,
            ),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
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
                if (showChevron) ...[
                  const SizedBox(width: 5),
                  Icon(
                    PhosphorIcons.caretRight(),
                    size: 16,
                    color: AppColors.textPrimary,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDeleteAccountButton() {
    return InkWell(
      onTap: () => _showDeleteAccountDialog(context),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 30),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(color: AppColors.secondary, width: 1),
          ),
        ),
        child: Center(
          child: Text(
            'DELETE ACCOUNT',
            style: AppTypography.bodyL.copyWith(
              color: AppColors.error,
            ),
          ),
        ),
      ),
    );
  }

  void _showEditBottomSheet(
    BuildContext context, {
    required String title,
    required String fieldName,
    required String currentValue,
    required String hint,
  }) {
    final controller = TextEditingController(text: currentValue);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(20),
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
                      style: AppTypography.bodyL.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Icon(
                        PhosphorIcons.x(),
                        size: 20,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),

              // Text Field
              Padding(
                padding: const EdgeInsets.all(20),
                child: AppTextField(
                  controller: controller,
                  hintText: hint,
                  textCapitalization: fieldName == 'username' 
                      ? TextCapitalization.none 
                      : TextCapitalization.words,
                ),
              ),

              // Buttons
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          side: const BorderSide(color: AppColors.textPrimary),
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.zero,
                          ),
                        ),
                        child: Text(
                          'Cancel',
                          style: AppTypography.bodyM.copyWith(
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          _updateProfile(fieldName, controller.text);
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: AppColors.textPrimary,
                          foregroundColor: Colors.white,
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.zero,
                          ),
                        ),
                        child: Text(
                          'Save',
                          style: AppTypography.bodyM.copyWith(
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showEmailEditBottomSheet(BuildContext context, String currentEmail) {
    final controller = TextEditingController(text: currentEmail);
    final formKey = GlobalKey<FormState>();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: SafeArea(
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    border: Border(
                      bottom: BorderSide(color: AppColors.secondary, width: 1),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Edit Email',
                        style: AppTypography.bodyL.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Icon(
                          PhosphorIcons.x(),
                          size: 20,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),

                // Info text
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                  child: Text(
                    'After updating your email, you will receive a verification link to your new email address.',
                    style: AppTypography.bodyS.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),

                // Text Field
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                  child: AppTextField(
                    controller: controller,
                    hintText: 'Enter your new email',
                    keyboardType: TextInputType.emailAddress,
                    textCapitalization: TextCapitalization.none,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Email is required';
                      }
                      final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
                      if (!emailRegex.hasMatch(value)) {
                        return 'Please enter a valid email';
                      }
                      if (value.toLowerCase().trim() == currentEmail.toLowerCase()) {
                        return 'New email must be different';
                      }
                      return null;
                    },
                  ),
                ),

                // Buttons
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(context),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            side: const BorderSide(color: AppColors.textPrimary),
                            shape: const RoundedRectangleBorder(
                              borderRadius: BorderRadius.zero,
                            ),
                          ),
                          child: Text(
                            'Cancel',
                            style: AppTypography.bodyM.copyWith(
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            if (formKey.currentState?.validate() ?? false) {
                              Navigator.pop(context);
                              context.read<AuthBloc>().add(
                                AuthUpdateEmailRequested(controller.text.toLowerCase().trim()),
                              );
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            backgroundColor: AppColors.textPrimary,
                            foregroundColor: Colors.white,
                            shape: const RoundedRectangleBorder(
                              borderRadius: BorderRadius.zero,
                            ),
                          ),
                          child: Text(
                            'Update Email',
                            style: AppTypography.bodyM.copyWith(
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _pickProfilePhoto(BuildContext ctx) async {
    final photo = await ImagePickerUtils.pickSingleImage(ctx);
    if (photo != null && mounted) {
      // ignore: use_build_context_synchronously
      context.read<AuthBloc>().add(AuthUpdatePhotoRequested(photo.path));
    }
  }

  String _getLanguageDisplayName(String? languageCode) {
    const languages = {
      'en': 'English',
      'fr': 'French',
    };
    return languages[languageCode] ?? 'English';
  }

  void _showLanguageSelector(BuildContext context, String? currentLanguage) {
    // Languages - English and French only for now
    final languages = {
      'en': 'English',
      'fr': 'French',
    };

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: AppColors.secondary, width: 1),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Select Language',
                    style: AppTypography.bodyL.copyWith(fontWeight: FontWeight.w700),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Icon(
                      PhosphorIcons.x(),
                      size: 20,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: languages.length,
                itemBuilder: (context, index) {
                  final code = languages.keys.elementAt(index);
                  final name = languages[code]!;
                  final isSelected = code == currentLanguage;
                  return ListTile(
                    title: Text(name),
                    trailing: isSelected
                        ? Icon(PhosphorIcons.check(), color: AppColors.primary)
                        : null,
                    onTap: () {
                      Navigator.pop(context);
                      context.read<AuthBloc>().add(AuthUpdateProfileRequested({'language': code}));
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showCountrySelector(BuildContext context) async {
    final currentCountryId = context.read<AuthBloc>().state.user?.country?.id;

    final selectedCountry = await CountryPickerSheet.show(
      context,
      selectedCountryId: currentCountryId,
    );

    if (selectedCountry != null && selectedCountry.id != currentCountryId) {
      _updateCountry(selectedCountry);
    }
  }

  Future<void> _updateCountry(CountryItem country) async {
    try {
      // Update country via API
      final authRepository = getIt<AuthRepository>();
      await authRepository.updateProfile({'country': country.id});

      // Reset the entire app
      await RestartWidget.restartApp();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update country: $e')),
        );
      }
    }
  }

  void _showDeleteAccountDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
        backgroundColor: AppColors.surface,
        title: Text(
          'Delete Account',
          style: AppTypography.titleLM.copyWith(color: AppColors.textPrimary),
        ),
        content: Text(
          'Are you sure you want to delete your account?\n\nYour account will be scheduled for deletion. All your data including styles, variations, and products will be permanently removed within 30 days.\n\nThis action cannot be undone.',
          style: AppTypography.bodyM.copyWith(color: AppColors.textPrimary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(
              'Cancel',
              style: AppTypography.bodyM.copyWith(color: AppColors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              context.read<AuthBloc>().add(const AuthDeleteAccountRequested());
            },
            child: Text(
              'Delete Account',
              style: AppTypography.bodyM.copyWith(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _updateProfile(String fieldName, String value) async {
    if (value.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Value cannot be empty')),
      );
      return;
    }
    
    context.read<AuthBloc>().add(AuthUpdateProfileRequested({fieldName: value.trim()}));
  }
}

