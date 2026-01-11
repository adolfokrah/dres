import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/sell/data/models/boost_tier_model.dart';

export 'package:dres/features/sell/data/models/boost_tier_model.dart';

/// Response from initiate boost payment endpoint
class InitiateBoostResponse {
  final bool success;
  final String message;
  final String? transactionId;
  final String? transactionDocId;
  final String? paymentUrl;
  final String? accessCode;
  final String? reference;
  final String? error;

  InitiateBoostResponse({
    required this.success,
    required this.message,
    this.transactionId,
    this.transactionDocId,
    this.paymentUrl,
    this.accessCode,
    this.reference,
    this.error,
  });

  factory InitiateBoostResponse.fromJson(Map<String, dynamic> json) {
    final transaction = json['transaction'] as Map<String, dynamic>?;
    final payment = json['payment'] as Map<String, dynamic>?;
    
    return InitiateBoostResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      transactionId: transaction?['transactionId'],
      transactionDocId: transaction?['id'],
      paymentUrl: payment?['authorizationUrl'],
      accessCode: payment?['accessCode'],
      reference: payment?['reference'],
      error: json['error'],
    );
  }
}

class BoostTiersRepository {
  final ApiService _apiService;

  BoostTiersRepository({required ApiService apiService})
      : _apiService = apiService;

  /// Fetch all active boost tiers with user's currency
  Future<BoostTiersResponse> getActiveBoostTiers() async {
    final response = await _apiService.get('/boost-tiers/active');
    final data = response.data as Map<String, dynamic>;
    return BoostTiersResponse.fromJson(data);
  }

  /// Initiate boost payment for a style
  /// Returns payment URL and transaction ID for the payment flow
  Future<InitiateBoostResponse> initiateBoostPayment({
    required String styleId,
    required String tierId,
  }) async {
    final response = await _apiService.post(
      '/boost-tiers/initiate',
      data: {
        'styleId': styleId,
        'tierId': tierId,
      },
    );
    final data = response.data as Map<String, dynamic>;
    return InitiateBoostResponse.fromJson(data);
  }
}
