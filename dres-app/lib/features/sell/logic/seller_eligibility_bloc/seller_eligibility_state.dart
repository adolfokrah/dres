part of 'seller_eligibility_bloc.dart';

enum SellerEligibilityStatus { initial, loading, loaded, error }

class SellerEligibilityState extends Equatable {
  final SellerEligibilityStatus status;
  final SellerEligibilityModel? eligibility;
  final String? error;

  const SellerEligibilityState({
    this.status = SellerEligibilityStatus.initial,
    this.eligibility,
    this.error,
  });

  /// Whether the user can sell
  bool get canSell => eligibility?.canSell ?? false;

  /// Progress percentage (0-100)
  int get progress => eligibility?.progress ?? 0;

  /// Number of completed requirements
  int get completedCount => eligibility?.completedCount ?? 0;

  /// Total number of requirements
  int get totalCount => eligibility?.totalCount ?? 5;

  SellerEligibilityState copyWith({
    SellerEligibilityStatus? status,
    SellerEligibilityModel? eligibility,
    String? error,
  }) {
    return SellerEligibilityState(
      status: status ?? this.status,
      eligibility: eligibility ?? this.eligibility,
      error: error ?? this.error,
    );
  }

  @override
  List<Object?> get props => [status, eligibility, error];
}
