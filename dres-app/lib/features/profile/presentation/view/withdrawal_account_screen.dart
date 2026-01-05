import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/app_button.dart';
import 'package:dres/core/widgets/app_dropdown.dart';
import 'package:dres/core/widgets/app_text_field.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:dres/features/auth/data/models/auth_models.dart';
import 'package:dres/features/profile/data/models/bank_model.dart';
import 'package:dres/features/profile/logic/withdrawal_account_bloc/withdrawal_account_bloc.dart';
import 'package:dres/features/profile/logic/withdrawal_account_bloc/withdrawal_account_event.dart';
import 'package:dres/features/profile/logic/withdrawal_account_bloc/withdrawal_account_state.dart';

class WithdrawalAccountScreen extends StatefulWidget {
  const WithdrawalAccountScreen({super.key});

  @override
  State<WithdrawalAccountScreen> createState() =>
      _WithdrawalAccountScreenState();
}

class _WithdrawalAccountScreenState extends State<WithdrawalAccountScreen> {
  late final WithdrawalAccountBloc _bloc;
  final TextEditingController _accountNumberController = TextEditingController();
  Timer? _debounceTimer;
  bool _hasPrefilled = false;

  @override
  void initState() {
    super.initState();
    _bloc = getIt<WithdrawalAccountBloc>();

    // Refresh auth data first, then fetch banks
    context.read<AuthBloc>().add(const AuthCheckStatusRequested());
    _bloc.add(const WithdrawalAccountBanksFetchRequested());
  }

  @override
  void dispose() {
    _accountNumberController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  /// Prefill form with existing withdrawal account data
  void _prefillFromUser(List<BankModel> banks, WithdrawalAccount? withdrawalAccount) {
    if (_hasPrefilled) return;
    if (withdrawalAccount == null || !withdrawalAccount.hasData) return;

    _hasPrefilled = true;

    // Find matching bank by name
    final matchingBank = banks.cast<BankModel?>().firstWhere(
          (bank) =>
              bank?.name.toLowerCase() ==
              withdrawalAccount.bank?.toLowerCase(),
          orElse: () => null,
        );

    if (matchingBank != null) {
      _bloc.add(WithdrawalAccountBankSelected(matchingBank));
    }

    // Prefill account number
    if (withdrawalAccount.accountNumber != null) {
      _accountNumberController.text = withdrawalAccount.accountNumber!;
      _bloc.add(WithdrawalAccountNumberChanged(withdrawalAccount.accountNumber!));
    }

    // Prefill account name (don't trigger resolve since we already have it)
    if (withdrawalAccount.accountName != null) {
      _bloc.add(WithdrawalAccountPrefillAccountName(withdrawalAccount.accountName!));
    }

    // Set original values for change detection
    _bloc.add(WithdrawalAccountSetOriginalValues(
      bankName: withdrawalAccount.bank,
      accountNumber: withdrawalAccount.accountNumber,
      accountName: withdrawalAccount.accountName,
    ));
  }

  void _onAccountNumberChanged(String value) {
    _bloc.add(WithdrawalAccountNumberChanged(value));

    // Debounce the resolve request
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      final state = _bloc.state;
      if (state.selectedBank != null && value.length >= 10) {
        _bloc.add(WithdrawalAccountResolveRequested(
          accountNumber: value,
          bankCode: state.selectedBank!.code,
        ));
      }
    });
  }

  void _onBankSelected(BankModel? bank) {
    _bloc.add(WithdrawalAccountBankSelected(bank));

    // If account number already entered, trigger resolve
    if (bank != null && _accountNumberController.text.length >= 10) {
      _debounceTimer?.cancel();
      _debounceTimer = Timer(const Duration(milliseconds: 300), () {
        _bloc.add(WithdrawalAccountResolveRequested(
          accountNumber: _accountNumberController.text,
          bankCode: bank.code,
        ));
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _bloc,
      child: BlocListener<AuthBloc, AuthState>(
        listener: (context, authState) {
          // When auth state updates and we have banks, try to prefill
          final withdrawalState = _bloc.state;
          if (withdrawalState.banks.isNotEmpty && !_hasPrefilled) {
            _prefillFromUser(
              withdrawalState.banks,
              authState.user?.withdrawalAccount,
            );
          }
        },
        child: BlocConsumer<WithdrawalAccountBloc, WithdrawalAccountState>(
          listener: (context, state) {
            // When banks are loaded, try to prefill with current auth data
            if (state.status == WithdrawalAccountStatus.banksLoaded &&
                state.banks.isNotEmpty &&
                !_hasPrefilled) {
              final authState = context.read<AuthBloc>().state;
              _prefillFromUser(
                state.banks,
                authState.user?.withdrawalAccount,
              );
            }

            if (state.status == WithdrawalAccountStatus.saved) {
              // Force refresh user data to get updated withdrawal account
              context.read<AuthBloc>().add(const AuthRefreshUserRequested());

              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Withdrawal account saved successfully'),
                  backgroundColor: AppColors.success,
                ),
              );
            }
          },
          builder: (context, state) {
            return Scaffold(
              backgroundColor: AppColors.background,
              body: SafeArea(
                child: Column(
                  children: [
                    // Header
                    _buildHeader(context),

                    // Form content
                    Expanded(
                      child: SingleChildScrollView(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          child: Column(
                            children: [
                              // Bank dropdown
                              Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 20),
                                child: AppDropdown<BankModel>(
                                  label: 'Bank',
                                  hintText: 'Select your bank',
                                  value: state.selectedBank,
                                  items: state.banks,
                                  itemLabel: (bank) => bank.name,
                                  onChanged: _onBankSelected,
                                  isLoading: state.status ==
                                      WithdrawalAccountStatus.loadingBanks,
                                  errorText: state.status ==
                                              WithdrawalAccountStatus.error &&
                                          state.banks.isEmpty
                                      ? state.errorMessage
                                      : null,
                                ),
                              ),

                              const SizedBox(height: 18),

                              // Account number input
                              Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 20),
                                child: AppTextField(
                                  label: 'Account Number',
                                  hintText: 'Enter account number',
                                  controller: _accountNumberController,
                                  keyboardType: TextInputType.number,
                                  onChanged: _onAccountNumberChanged,
                                ),
                              ),

                              const SizedBox(height: 18),

                              // Account name (read-only, resolved from API)
                              Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 20),
                                child: _buildAccountNameField(state),
                              ),

                              // Error message
                              if (state.errorMessage != null &&
                                  state.status ==
                                      WithdrawalAccountStatus.error) ...[
                                const SizedBox(height: 12),
                                Padding(
                                  padding:
                                      const EdgeInsets.symmetric(horizontal: 20),
                                  child: Text(
                                    state.errorMessage!,
                                    style: AppTypography.bodyM.copyWith(
                                      color: AppColors.error,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ),

                    // Save button
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.secondary,
                      ),
                      child: AppButton.filled(
                        text: 'Save Withdrawal Account',
                        isFullWidth: true,
                        isLoading:
                            state.status == WithdrawalAccountStatus.saving,
                        onPressed: state.canSave
                            ? () => _bloc.add(const WithdrawalAccountSaveRequested())
                            : null,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: AppColors.secondary,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          // Back button
          GestureDetector(
            onTap: () {
              if (context.canPop()) {
                context.pop();
              } else {
                context.go('/profile');
              }
            },
            child: PhosphorIcon(
              PhosphorIcons.caretLeft(),
              size: 16,
              color: AppColors.textPrimary,
            ),
          ),

          // Title - centered
          Expanded(
            child: Text(
              'Withdrawal Account',
              style: AppTypography.bodyL.copyWith(
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
          ),

          // Placeholder for balance
          const SizedBox(width: 32),
        ],
      ),
    );
  }

  Widget _buildAccountNameField(WithdrawalAccountState state) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Account Name',
          style: AppTypography.bodyM.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          decoration: BoxDecoration(
            color: AppColors.secondary,
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Expanded(
                child: state.isResolvingAccount
                    ? Row(
                        children: [
                          SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.textHint,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'Verifying account...',
                            style: AppTypography.bodyM.copyWith(
                              color: AppColors.textHint,
                            ),
                          ),
                        ],
                      )
                    : Text(
                        state.resolvedAccountName ?? '',
                        style: AppTypography.bodyM.copyWith(
                          color: state.resolvedAccountName != null
                              ? AppColors.textPrimary
                              : AppColors.textHint,
                        ),
                      ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
