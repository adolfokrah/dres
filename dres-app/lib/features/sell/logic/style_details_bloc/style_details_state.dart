import 'package:equatable/equatable.dart';
import 'package:dres/features/sell/data/repositories/sell_repository.dart';

enum StyleDetailsStatus {
  initial,
  creating,
  createSuccess,
  loading,
  loaded,
  updating,
  updateSuccess,
  failure,
}

class StyleDetailsState extends Equatable {
  final StyleDetailsStatus status;
  final String? styleId;
  final StyleDetailsModel? styleDetails;
  final String? errorMessage;

  const StyleDetailsState({
    this.status = StyleDetailsStatus.initial,
    this.styleId,
    this.styleDetails,
    this.errorMessage,
  });

  StyleDetailsState copyWith({
    StyleDetailsStatus? status,
    String? styleId,
    StyleDetailsModel? styleDetails,
    String? errorMessage,
  }) {
    return StyleDetailsState(
      status: status ?? this.status,
      styleId: styleId ?? this.styleId,
      styleDetails: styleDetails ?? this.styleDetails,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, styleId, styleDetails, errorMessage];
}
