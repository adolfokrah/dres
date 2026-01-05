import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/features/profile/data/repositories/withdrawal_account_repository.dart';
import 'withdrawal_account_event.dart';
import 'withdrawal_account_state.dart';

class WithdrawalAccountBloc
    extends Bloc<WithdrawalAccountEvent, WithdrawalAccountState> {
  final WithdrawalAccountRepository _repository;

  WithdrawalAccountBloc({
    required WithdrawalAccountRepository repository,
  })  : _repository = repository,
        super(const WithdrawalAccountState()) {
    on<WithdrawalAccountBanksFetchRequested>(_onBanksFetchRequested);
    on<WithdrawalAccountBankSelected>(_onBankSelected);
    on<WithdrawalAccountNumberChanged>(_onAccountNumberChanged);
    on<WithdrawalAccountResolveRequested>(_onResolveRequested);
    on<WithdrawalAccountSaveRequested>(_onSaveRequested);
    on<WithdrawalAccountFormReset>(_onFormReset);
    on<WithdrawalAccountPrefillAccountName>(_onPrefillAccountName);
    on<WithdrawalAccountSetOriginalValues>(_onSetOriginalValues);
  }

  Future<void> _onBanksFetchRequested(
    WithdrawalAccountBanksFetchRequested event,
    Emitter<WithdrawalAccountState> emit,
  ) async {
    emit(state.copyWith(
      status: WithdrawalAccountStatus.loadingBanks,
      clearErrorMessage: true,
    ));

    try {
      final banks = await _repository.getBanks(
        country: event.country,
        currency: event.currency,
      );

      emit(state.copyWith(
        status: WithdrawalAccountStatus.banksLoaded,
        banks: banks,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: WithdrawalAccountStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }

  void _onBankSelected(
    WithdrawalAccountBankSelected event,
    Emitter<WithdrawalAccountState> emit,
  ) {
    emit(state.copyWith(
      selectedBank: event.bank,
      clearResolvedAccountName: true,
      clearErrorMessage: true,
    ));
  }

  void _onAccountNumberChanged(
    WithdrawalAccountNumberChanged event,
    Emitter<WithdrawalAccountState> emit,
  ) {
    emit(state.copyWith(
      accountNumber: event.accountNumber,
      clearResolvedAccountName: true,
      clearErrorMessage: true,
    ));
  }

  Future<void> _onResolveRequested(
    WithdrawalAccountResolveRequested event,
    Emitter<WithdrawalAccountState> emit,
  ) async {
    emit(state.copyWith(
      status: WithdrawalAccountStatus.resolvingAccount,
      isResolvingAccount: true,
      clearErrorMessage: true,
    ));

    try {
      final result = await _repository.resolveAccountNumber(
        accountNumber: event.accountNumber,
        bankCode: event.bankCode,
      );

      emit(state.copyWith(
        status: WithdrawalAccountStatus.accountResolved,
        resolvedAccountName: result.accountName,
        isResolvingAccount: false,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: WithdrawalAccountStatus.error,
        errorMessage: 'Could not verify account. Please check the details.',
        isResolvingAccount: false,
        clearResolvedAccountName: true,
      ));
    }
  }

  Future<void> _onSaveRequested(
    WithdrawalAccountSaveRequested event,
    Emitter<WithdrawalAccountState> emit,
  ) async {
    if (!state.canSave) return;

    emit(state.copyWith(
      status: WithdrawalAccountStatus.saving,
      clearErrorMessage: true,
    ));

    try {
      await _repository.saveWithdrawalAccount(
        bankCode: state.selectedBank!.code,
        bankName: state.selectedBank!.name,
        accountNumber: state.accountNumber,
        accountName: state.resolvedAccountName!,
      );

      // Update original values to match saved values (disables button until next change)
      emit(state.copyWith(
        status: WithdrawalAccountStatus.saved,
        originalBankName: state.selectedBank!.name,
        originalAccountNumber: state.accountNumber,
        originalAccountName: state.resolvedAccountName,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: WithdrawalAccountStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }

  void _onFormReset(
    WithdrawalAccountFormReset event,
    Emitter<WithdrawalAccountState> emit,
  ) {
    emit(state.copyWith(
      status: state.banks.isNotEmpty
          ? WithdrawalAccountStatus.banksLoaded
          : WithdrawalAccountStatus.initial,
      clearSelectedBank: true,
      accountNumber: '',
      clearResolvedAccountName: true,
      clearErrorMessage: true,
      isResolvingAccount: false,
    ));
  }

  void _onPrefillAccountName(
    WithdrawalAccountPrefillAccountName event,
    Emitter<WithdrawalAccountState> emit,
  ) {
    emit(state.copyWith(
      resolvedAccountName: event.accountName,
    ));
  }

  void _onSetOriginalValues(
    WithdrawalAccountSetOriginalValues event,
    Emitter<WithdrawalAccountState> emit,
  ) {
    emit(state.copyWith(
      originalBankName: event.bankName,
      originalAccountNumber: event.accountNumber,
      originalAccountName: event.accountName,
    ));
  }
}
