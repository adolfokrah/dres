/// Transaction type enum
enum TransactionType {
  orderPayment('order_payment'),
  transfer('transfer'),
  refund('refund'),
  returnCharge('return_charge');

  const TransactionType(this.value);
  final String value;

  static TransactionType fromString(String value) {
    switch (value) {
      case 'order_payment':
        return TransactionType.orderPayment;
      case 'transfer':
        return TransactionType.transfer;
      case 'refund':
        return TransactionType.refund;
      case 'return_charge':
        return TransactionType.returnCharge;
      default:
        return TransactionType.orderPayment;
    }
  }

  String get displayName {
    switch (this) {
      case TransactionType.orderPayment:
        return 'Order Payment';
      case TransactionType.transfer:
        return 'Transfer';
      case TransactionType.refund:
        return 'Refund';
      case TransactionType.returnCharge:
        return 'Return Charge';
    }
  }
}

/// Transaction status enum
enum TransactionStatus {
  pending('pending'),
  inProgress('in_progress'),
  completed('completed'),
  cancelled('cancelled');

  const TransactionStatus(this.value);
  final String value;

  static TransactionStatus fromString(String value) {
    switch (value) {
      case 'pending':
        return TransactionStatus.pending;
      case 'in_progress':
        return TransactionStatus.inProgress;
      case 'completed':
        return TransactionStatus.completed;
      case 'cancelled':
        return TransactionStatus.cancelled;
      default:
        return TransactionStatus.pending;
    }
  }

  String get displayName {
    switch (this) {
      case TransactionStatus.pending:
        return 'Pending';
      case TransactionStatus.inProgress:
        return 'In Progress';
      case TransactionStatus.completed:
        return 'Completed';
      case TransactionStatus.cancelled:
        return 'Cancelled';
    }
  }

  String get apiValue => value;
}

/// Transaction model
class TransactionModel {
  final String id;
  final String transactionId;
  final TransactionType type;
  final TransactionStatus status;
  final double amount;
  final double fees;
  final String orderId;
  final String orderDisplayId;
  final String currencySymbol;
  final DateTime createdAt;

  TransactionModel({
    required this.id,
    required this.transactionId,
    required this.type,
    required this.status,
    required this.amount,
    required this.fees,
    required this.orderId,
    required this.orderDisplayId,
    required this.currencySymbol,
    required this.createdAt,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'] ?? '',
      transactionId: json['transactionId'] ?? '',
      type: TransactionType.fromString(json['type'] ?? 'order_payment'),
      status: TransactionStatus.fromString(json['status'] ?? 'pending'),
      amount: (json['amount'] ?? 0).toDouble(),
      fees: (json['fees'] ?? 0).toDouble(),
      orderId: json['orderId'] ?? '',
      orderDisplayId: json['orderDisplayId'] ?? '',
      currencySymbol: json['currencySymbol'] ?? '₵',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }
}

/// User transactions response with pagination and summaries
class UserTransactionsResponse {
  final double totalEarned;
  final double availableBalance;
  final double withdrawalFee;
  final double minimumWithdrawalAmount;
  final bool hasWithdrawalAccount;
  final String currencySymbol;
  final List<TransactionModel> transactions;
  final int totalDocs;
  final int totalPages;
  final int page;
  final int limit;
  final bool hasNextPage;
  final bool hasPrevPage;

  UserTransactionsResponse({
    required this.totalEarned,
    required this.availableBalance,
    required this.withdrawalFee,
    required this.minimumWithdrawalAmount,
    required this.hasWithdrawalAccount,
    required this.currencySymbol,
    required this.transactions,
    required this.totalDocs,
    required this.totalPages,
    required this.page,
    required this.limit,
    required this.hasNextPage,
    required this.hasPrevPage,
  });

  factory UserTransactionsResponse.fromJson(Map<String, dynamic> json) {
    return UserTransactionsResponse(
      totalEarned: (json['totalEarned'] ?? 0).toDouble(),
      availableBalance: (json['availableBalance'] ?? 0).toDouble(),
      withdrawalFee: (json['withdrawalFee'] ?? 1).toDouble(),
      minimumWithdrawalAmount: (json['minimumWithdrawalAmount'] ?? 5).toDouble(),
      hasWithdrawalAccount: json['hasWithdrawalAccount'] ?? false,
      currencySymbol: json['currencySymbol'] ?? '₵',
      transactions: (json['transactions'] as List<dynamic>?)
              ?.map((e) => TransactionModel.fromJson(e))
              .toList() ??
          [],
      totalDocs: json['totalDocs'] ?? 0,
      totalPages: json['totalPages'] ?? 1,
      page: json['page'] ?? 1,
      limit: json['limit'] ?? 10,
      hasNextPage: json['hasNextPage'] ?? false,
      hasPrevPage: json['hasPrevPage'] ?? false,
    );
  }
}

/// Withdrawal response model
class WithdrawalResponse {
  final bool success;
  final String message;
  final String transactionId;
  final double amount;
  final double fee;
  final double previousBalance;
  final double newBalance;

  WithdrawalResponse({
    required this.success,
    required this.message,
    required this.transactionId,
    required this.amount,
    required this.fee,
    required this.previousBalance,
    required this.newBalance,
  });

  factory WithdrawalResponse.fromJson(Map<String, dynamic> json) {
    return WithdrawalResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      transactionId: json['transactionId'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      fee: (json['fee'] ?? 0).toDouble(),
      previousBalance: (json['previousBalance'] ?? 0).toDouble(),
      newBalance: (json['newBalance'] ?? 0).toDouble(),
    );
  }
}
