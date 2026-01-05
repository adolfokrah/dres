import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/profile/data/models/bank_model.dart';
import 'package:dres/features/profile/data/models/resolve_account_response.dart';

class WithdrawalAccountRepository {
  final ApiService _apiService;

  WithdrawalAccountRepository({required ApiService apiService})
      : _apiService = apiService;

  /// Fetch list of banks for a specific country
  Future<List<BankModel>> getBanks({
    String country = 'ghana',
    String currency = 'GHS',
  }) async {
    final response = await _apiService.get(
      '/users/banks',
      queryParameters: {
        'country': country,
        'currency': currency,
      },
    );

    final data = response.data;
    if (data['success'] == true && data['data'] != null) {
      final banksList = data['data'] as List;
      return banksList
          .map((bank) => BankModel.fromJson(bank as Map<String, dynamic>))
          .toList();
    }

    throw Exception(data['error'] ?? 'Failed to fetch banks');
  }

  /// Resolve/verify a bank account number to get the account name
  Future<ResolveAccountResponse> resolveAccountNumber({
    required String accountNumber,
    required String bankCode,
  }) async {
    final response = await _apiService.get(
      '/users/resolve-account',
      queryParameters: {
        'account_number': accountNumber,
        'bank_code': bankCode,
      },
    );

    final data = response.data;
    if (data['success'] == true && data['data'] != null) {
      return ResolveAccountResponse.fromJson(
        data['data'] as Map<String, dynamic>,
      );
    }

    throw Exception(data['error'] ?? 'Failed to resolve account');
  }

  /// Save withdrawal account to user profile
  Future<void> saveWithdrawalAccount({
    required String bankCode,
    required String bankName,
    required String accountNumber,
    required String accountName,
  }) async {
    await _apiService.post(
      '/users/withdrawal-account',
      data: {
        'bankCode': bankCode,
        'bankName': bankName,
        'accountNumber': accountNumber,
        'accountName': accountName,
      },
    );
  }
}
