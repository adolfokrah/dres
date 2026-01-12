import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/sell/logic/seller_eligibility_bloc/seller_eligibility_bloc.dart';
import 'package:dres/features/sell/data/models/seller_eligibility_model.dart';

/// Screen shown when a user tries to sell but hasn't completed all requirements
class SellerOnboardingScreen extends StatefulWidget {
  const SellerOnboardingScreen({super.key});

  @override
  State<SellerOnboardingScreen> createState() => _SellerOnboardingScreenState();
}

class _SellerOnboardingScreenState extends State<SellerOnboardingScreen> {
  late final SellerEligibilityBloc _bloc;

  @override
  void initState() {
    super.initState();
    _bloc = getIt<SellerEligibilityBloc>();
    _bloc.add(const SellerEligibilityFetchRequested());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            UnifiedHeader.titleOnly(
              title: 'Start Selling',
              onBackTap: () => context.pop(),
            ),
            Expanded(
              child: BlocBuilder<SellerEligibilityBloc, SellerEligibilityState>(
                bloc: _bloc,
                builder: (context, state) {
                  if (state.status == SellerEligibilityStatus.loading) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  if (state.status == SellerEligibilityStatus.error) {
                    return _buildErrorState(state.error);
                  }

                  if (state.eligibility == null) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  return _buildContent(state.eligibility!);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(String? error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            PhosphorIcons.warningCircle(),
            size: 48,
            color: AppColors.error,
          ),
          const SizedBox(height: 16),
          Text(
            'Failed to load requirements',
            style: AppTypography.bodyM.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 16),
          AppButton(
            text: 'Retry',
            onPressed: () {
              _bloc.add(const SellerEligibilityFetchRequested());
            },
          ),
        ],
      ),
    );
  }

  Widget _buildContent(SellerEligibilityModel eligibility) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Progress indicator
          _buildProgressSection(eligibility),
          const SizedBox(height: 32),

          // Title
          Text(
            'Complete your seller profile',
            style: AppTypography.titleLM,
          ),
          const SizedBox(height: 8),
          Text(
            'Before you can list items for sale, please complete the following requirements:',
            style: AppTypography.bodyM.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 24),

          // Requirements checklist
          ...eligibility.requirements.asList.map((entry) {
            return _buildRequirementItem(
              entry.key,
              entry.value,
            );
          }),

          const SizedBox(height: 32),

          // CTA if all complete
          if (eligibility.canSell)
            AppButton(
              text: 'Done',
              onPressed: () {
                context.pop();
              },
              isFullWidth: true,
            ),
        ],
      ),
    );
  }

  Widget _buildProgressSection(SellerEligibilityModel eligibility) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: eligibility.canSell ? AppColors.success.withOpacity(0.1) : AppColors.surface,
        border: Border.all(
          color: eligibility.canSell ? AppColors.success : AppColors.border,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: eligibility.canSell ? AppColors.success : AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: eligibility.canSell
                      ? Icon(PhosphorIcons.check(PhosphorIconsStyle.bold), color: Colors.white)
                      : Text(
                          '${eligibility.completedCount}/${eligibility.totalCount}',
                          style: AppTypography.bodyS.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      eligibility.canSell ? 'You\'re ready to sell!' : 'Almost there!',
                      style: AppTypography.bodyL.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      eligibility.canSell
                          ? 'All requirements completed'
                          : '${eligibility.totalCount - eligibility.completedCount} more step${eligibility.totalCount - eligibility.completedCount > 1 ? 's' : ''} to go',
                      style: AppTypography.bodyS.copyWith(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            child: LinearProgressIndicator(
              value: eligibility.progress / 100,
              backgroundColor: AppColors.border,
              color: eligibility.canSell ? AppColors.success : AppColors.primary,
              minHeight: 8,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRequirementItem(String title, RequirementStatus requirement) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: requirement.complete ? null : () => _navigateToRequirement(title),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            border: Border.all(
              color: requirement.complete ? AppColors.success : AppColors.border,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: requirement.complete
                      ? AppColors.success.withOpacity(0.1)
                      : AppColors.background,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: requirement.complete ? AppColors.success : AppColors.border,
                  ),
                ),
                child: Center(
                  child: requirement.complete
                      ? Icon(PhosphorIcons.check(PhosphorIconsStyle.bold),
                          color: AppColors.success, size: 20)
                      : Icon(_getIconForRequirement(title),
                          color: AppColors.textSecondary, size: 20),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      requirement.complete
                          ? _getCompletedText(title, requirement)
                          : requirement.message,
                      style: AppTypography.bodyS.copyWith(
                        color: requirement.complete
                            ? AppColors.success
                            : AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              if (!requirement.complete)
                Icon(
                  PhosphorIcons.caretRight(),
                  color: AppColors.textSecondary,
                ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getIconForRequirement(String title) {
    switch (title) {
      case 'Shop Name':
        return PhosphorIcons.storefront();
      case 'Phone Number':
        return PhosphorIcons.phone();
      case 'Profile Photo':
        return PhosphorIcons.camera();
      case 'Withdrawal Account':
        return PhosphorIcons.bank();
      case 'Shipping Rates':
        return PhosphorIcons.truck();
      default:
        return PhosphorIcons.check();
    }
  }

  String _getCompletedText(String title, RequirementStatus requirement) {
    switch (title) {
      case 'Shop Name':
        return requirement.value ?? 'Completed';
      case 'Phone Number':
        return requirement.value ?? 'Completed';
      case 'Profile Photo':
        return 'Photo uploaded';
      case 'Withdrawal Account':
        if (requirement.details != null) {
          return '${requirement.details!.bank ?? ''} ${requirement.details!.accountNumber ?? ''}'.trim();
        }
        return 'Completed';
      case 'Shipping Rates':
        final count = requirement.count ?? 0;
        return '$count rate${count != 1 ? 's' : ''} configured';
      default:
        return 'Completed';
    }
  }

  void _navigateToRequirement(String title) async {
    switch (title) {
      case 'Shop Name':
      case 'Phone Number':
      case 'Profile Photo':
        await context.push('/profile/personal-info');
        break;
      case 'Withdrawal Account':
        await context.push('/profile/withdrawal-account');
        break;
      case 'Shipping Rates':
        await context.push('/profile/shipping-rates');
        break;
    }
    // Refresh eligibility after returning from settings
    if (mounted) {
      _bloc.add(const SellerEligibilityRefreshRequested());
    }
  }
}
