import 'package:equatable/equatable.dart';
import 'package:dres/features/profile/data/models/purchase_model.dart';

enum PurchasesStatus { initial, loading, success, error }

class PurchasesState extends Equatable {
  final PurchasesStatus status;
  final List<PurchaseModel> purchases;
  final String? statusFilter;
  final int currentPage;
  final bool hasMore;
  final String? error;

  const PurchasesState({
    this.status = PurchasesStatus.initial,
    this.purchases = const [],
    this.statusFilter,
    this.currentPage = 1,
    this.hasMore = true,
    this.error,
  });

  PurchasesState copyWith({
    PurchasesStatus? status,
    List<PurchaseModel>? purchases,
    String? statusFilter,
    bool clearStatusFilter = false,
    int? currentPage,
    bool? hasMore,
    String? error,
  }) {
    return PurchasesState(
      status: status ?? this.status,
      purchases: purchases ?? this.purchases,
      statusFilter: clearStatusFilter ? null : (statusFilter ?? this.statusFilter),
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
      error: error,
    );
  }

  @override
  List<Object?> get props => [status, purchases, statusFilter, currentPage, hasMore, error];
}
