part of 'seller_eligibility_bloc.dart';

abstract class SellerEligibilityEvent extends Equatable {
  const SellerEligibilityEvent();

  @override
  List<Object?> get props => [];
}

/// Fetch seller eligibility status
class SellerEligibilityFetchRequested extends SellerEligibilityEvent {
  const SellerEligibilityFetchRequested();
}

/// Refresh eligibility (e.g., after completing a requirement)
class SellerEligibilityRefreshRequested extends SellerEligibilityEvent {
  const SellerEligibilityRefreshRequested();
}

/// Clear eligibility state (e.g., on logout)
class SellerEligibilityClearRequested extends SellerEligibilityEvent {
  const SellerEligibilityClearRequested();
}
