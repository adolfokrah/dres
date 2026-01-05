import 'package:equatable/equatable.dart';
import 'package:dres/features/profile/data/models/bank_model.dart';

abstract class WithdrawalAccountEvent extends Equatable {
  const WithdrawalAccountEvent();

  @override
  List<Object?> get props => [];
}

/// Fetch list of banks
class WithdrawalAccountBanksFetchRequested extends WithdrawalAccountEvent {
  final String country;
  final String currency;

  const WithdrawalAccountBanksFetchRequested({
    this.country = 'ghana',
    this.currency = 'GHS',
  });

  @override
  List<Object?> get props => [country, currency];
}

/// Bank selected from dropdown
class WithdrawalAccountBankSelected extends WithdrawalAccountEvent {
  final BankModel? bank;

  const WithdrawalAccountBankSelected(this.bank);

  @override
  List<Object?> get props => [bank];
}

/// Account number changed (triggers debounced resolve)
class WithdrawalAccountNumberChanged extends WithdrawalAccountEvent {
  final String accountNumber;

  const WithdrawalAccountNumberChanged(this.accountNumber);

  @override
  List<Object?> get props => [accountNumber];
}

/// Resolve account number to get account name
class WithdrawalAccountResolveRequested extends WithdrawalAccountEvent {
  final String accountNumber;
  final String bankCode;

  const WithdrawalAccountResolveRequested({
    required this.accountNumber,
    required this.bankCode,
  });

  @override
  List<Object?> get props => [accountNumber, bankCode];
}

/// Save withdrawal account
class WithdrawalAccountSaveRequested extends WithdrawalAccountEvent {
  const WithdrawalAccountSaveRequested();
}

/// Reset form
class WithdrawalAccountFormReset extends WithdrawalAccountEvent {
  const WithdrawalAccountFormReset();
}

/// Prefill account name without triggering resolve (for existing data)
class WithdrawalAccountPrefillAccountName extends WithdrawalAccountEvent {
  final String accountName;

  const WithdrawalAccountPrefillAccountName(this.accountName);

  @override
  List<Object?> get props => [accountName];
}

/// Set original values for change detection (called after prefill)
class WithdrawalAccountSetOriginalValues extends WithdrawalAccountEvent {
  final String? bankName;
  final String? accountNumber;
  final String? accountName;

  const WithdrawalAccountSetOriginalValues({
    this.bankName,
    this.accountNumber,
    this.accountName,
  });

  @override
  List<Object?> get props => [bankName, accountNumber, accountName];
}
