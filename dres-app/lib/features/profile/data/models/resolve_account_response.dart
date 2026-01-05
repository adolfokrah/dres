/// Response from Paystack resolve account endpoint
class ResolveAccountResponse {
  final String accountNumber;
  final String accountName;
  final int? bankId;

  const ResolveAccountResponse({
    required this.accountNumber,
    required this.accountName,
    this.bankId,
  });

  factory ResolveAccountResponse.fromJson(Map<String, dynamic> json) {
    return ResolveAccountResponse(
      accountNumber: json['accountNumber'] as String? ?? json['account_number'] as String,
      accountName: json['accountName'] as String? ?? json['account_name'] as String,
      bankId: json['bankId'] as int? ?? json['bank_id'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'account_number': accountNumber,
      'account_name': accountName,
      'bank_id': bankId,
    };
  }
}
