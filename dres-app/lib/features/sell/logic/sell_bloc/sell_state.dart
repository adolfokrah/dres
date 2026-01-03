part of 'sell_bloc.dart';

enum SellStatus { initial, loading, success, failure }

class SellState extends Equatable {
  final SellStatus status;
  final List<DraftStyleModel> drafts;
  final int totalDrafts;
  final String? errorMessage;

  const SellState({
    this.status = SellStatus.initial,
    this.drafts = const [],
    this.totalDrafts = 0,
    this.errorMessage,
  });

  SellState copyWith({
    SellStatus? status,
    List<DraftStyleModel>? drafts,
    int? totalDrafts,
    String? errorMessage,
  }) {
    return SellState(
      status: status ?? this.status,
      drafts: drafts ?? this.drafts,
      totalDrafts: totalDrafts ?? this.totalDrafts,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, drafts, totalDrafts, errorMessage];
}
