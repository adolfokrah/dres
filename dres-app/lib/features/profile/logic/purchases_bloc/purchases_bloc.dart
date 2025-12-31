import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:dres/features/profile/data/repositories/purchases_repository.dart';
import 'purchases_event.dart';
import 'purchases_state.dart';

export 'purchases_event.dart';
export 'purchases_state.dart';

class PurchasesBloc extends Bloc<PurchasesEvent, PurchasesState> {
  final PurchasesRepository _purchasesRepository;
  static const int _pageSize = 10;

  PurchasesBloc({
    required PurchasesRepository purchasesRepository,
  })  : _purchasesRepository = purchasesRepository,
        super(const PurchasesState()) {
    on<PurchasesFetchRequested>(_onFetchRequested);
    on<PurchasesLoadMoreRequested>(_onLoadMoreRequested);
    on<PurchasesFilterChanged>(_onFilterChanged);
  }

  String get _userId => getIt<AuthBloc>().state.user?.id ?? '';

  Future<void> _onFetchRequested(
    PurchasesFetchRequested event,
    Emitter<PurchasesState> emit,
  ) async {
    // Use clearStatusFilter when explicitly setting to null (All filter)
    emit(state.copyWith(
      status: PurchasesStatus.loading,
      statusFilter: event.statusFilter,
      clearStatusFilter: event.statusFilter == null,
      currentPage: 1,
    ));

    try {
      debugPrint('🛒 Fetching purchases for userId: $_userId with filter: ${event.statusFilter}');
      final response = await _purchasesRepository.getPurchases(
        userId: _userId,
        page: 1,
        limit: _pageSize,
        statusFilter: event.statusFilter,
      );
      debugPrint('🛒 Fetched ${response.docs.length} purchases');

      emit(state.copyWith(
        status: PurchasesStatus.success,
        purchases: response.docs,
        hasMore: response.hasNextPage,
        currentPage: response.page,
      ));
    } catch (e, stackTrace) {
      debugPrint('🛒 Error fetching purchases: $e');
      debugPrint('🛒 Stack trace: $stackTrace');
      emit(state.copyWith(
        status: PurchasesStatus.error,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onLoadMoreRequested(
    PurchasesLoadMoreRequested event,
    Emitter<PurchasesState> emit,
  ) async {
    if (!state.hasMore || state.status == PurchasesStatus.loading) return;

    try {
      final nextPage = state.currentPage + 1;
      final response = await _purchasesRepository.getPurchases(
        userId: _userId,
        page: nextPage,
        limit: _pageSize,
        statusFilter: state.statusFilter,
      );

      emit(state.copyWith(
        purchases: [...state.purchases, ...response.docs],
        hasMore: response.hasNextPage,
        currentPage: response.page,
      ));
    } catch (e) {
      // Silently fail on load more
      debugPrint('🛒 Error loading more purchases: $e');
    }
  }

  Future<void> _onFilterChanged(
    PurchasesFilterChanged event,
    Emitter<PurchasesState> emit,
  ) async {
    add(PurchasesFetchRequested(statusFilter: event.statusFilter));
  }
}
