import 'package:flutter/foundation.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/profile/data/models/transaction_model.dart';

export 'package:dres/features/profile/data/models/transaction_model.dart';

class TransactionsRepository {
  final ApiService _apiService;

  TransactionsRepository({required ApiService apiService}) : _apiService = apiService;

  /// Fetch user's transactions (excludes deposits)
  Future<UserTransactionsResponse> getUserTransactions({
    int page = 1,
    int limit = 10,
    String? typeFilter,
    String? statusFilter,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };

    if (typeFilter != null && typeFilter.isNotEmpty && typeFilter != 'all') {
      queryParams['type'] = typeFilter;
    }

    if (statusFilter != null && statusFilter.isNotEmpty && statusFilter != 'all') {
      queryParams['status'] = statusFilter;
    }

    final response = await _apiService.get(
      '/transactions/user-transactions',
      queryParameters: queryParams,
    );
    
    debugPrint('💰 TransactionsRepository: Raw response data: ${response.data}');
    
    final result = UserTransactionsResponse.fromJson(response.data);
    
    debugPrint('💰 TransactionsRepository: Parsed ${result.transactions.length} transactions');
    debugPrint('💰 Total Earned: ${result.totalEarned}, Available Balance: ${result.availableBalance}');

    return result;
  }

  /// Request withdrawal of available balance
  /// Returns the withdrawal response with transfer details
  Future<WithdrawalResponse> requestWithdrawal() async {
    final response = await _apiService.post(
      '/users/request-withdrawal',
      data: {},
    );

    debugPrint('💰 TransactionsRepository: Withdrawal response: ${response.data}');

    return WithdrawalResponse.fromJson(response.data);
  }
}
