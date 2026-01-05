import 'package:equatable/equatable.dart';
import 'package:dres/features/profile/data/models/bank_model.dart';

enum WithdrawalAccountStatus {
  initial,
  loadingBanks,
  banksLoaded,
  resolvingAccount,
  accountResolved,
  saving,
  saved,
  error,
}

class WithdrawalAccountState extends Equatable {
  final WithdrawalAccountStatus status;
  final List<BankModel> banks;
  final BankModel? selectedBank;
  final String accountNumber;
  final String? resolvedAccountName;
  final String? errorMessage;
  final bool isResolvingAccount;

  // Original values for change detection
  final String? originalBankName;
  final String? originalAccountNumber;
  final String? originalAccountName;

  const WithdrawalAccountState({
    this.status = WithdrawalAccountStatus.initial,
    this.banks = const [],
    this.selectedBank,
    this.accountNumber = '',
    this.resolvedAccountName,
    this.errorMessage,
    this.isResolvingAccount = false,
    this.originalBankName,
    this.originalAccountNumber,
    this.originalAccountName,
  });

  /// Check if form has changed from original values
  bool get hasChanges {
    final currentBankName = selectedBank?.name;
    final currentAccountNumber = accountNumber;
    final currentAccountName = resolvedAccountName;

    // If no original data, any valid form is a change
    if (originalBankName == null && originalAccountNumber == null) {
      return selectedBank != null && accountNumber.isNotEmpty;
    }

    return currentBankName != originalBankName ||
        currentAccountNumber != originalAccountNumber ||
        currentAccountName != originalAccountName;
  }

  /// Check if form is valid for saving
  bool get canSave =>
      selectedBank != null &&
      accountNumber.isNotEmpty &&
      resolvedAccountName != null &&
      resolvedAccountName!.isNotEmpty &&
      !isResolvingAccount &&
      hasChanges;

  /// Check if we should resolve account (bank selected and account number valid)
  bool get shouldResolveAccount =>
      selectedBank != null && accountNumber.length >= 10;

  WithdrawalAccountState copyWith({
    WithdrawalAccountStatus? status,
    List<BankModel>? banks,
    BankModel? selectedBank,
    bool clearSelectedBank = false,
    String? accountNumber,
    String? resolvedAccountName,
    bool clearResolvedAccountName = false,
    String? errorMessage,
    bool clearErrorMessage = false,
    bool? isResolvingAccount,
    String? originalBankName,
    String? originalAccountNumber,
    String? originalAccountName,
  }) {
    return WithdrawalAccountState(
      status: status ?? this.status,
      banks: banks ?? this.banks,
      selectedBank: clearSelectedBank ? null : selectedBank ?? this.selectedBank,
      accountNumber: accountNumber ?? this.accountNumber,
      resolvedAccountName: clearResolvedAccountName
          ? null
          : resolvedAccountName ?? this.resolvedAccountName,
      errorMessage:
          clearErrorMessage ? null : errorMessage ?? this.errorMessage,
      isResolvingAccount: isResolvingAccount ?? this.isResolvingAccount,
      originalBankName: originalBankName ?? this.originalBankName,
      originalAccountNumber: originalAccountNumber ?? this.originalAccountNumber,
      originalAccountName: originalAccountName ?? this.originalAccountName,
    );
  }

  @override
  List<Object?> get props => [
        status,
        banks,
        selectedBank,
        accountNumber,
        resolvedAccountName,
        errorMessage,
        isResolvingAccount,
        originalBankName,
        originalAccountNumber,
        originalAccountName,
      ];
}
