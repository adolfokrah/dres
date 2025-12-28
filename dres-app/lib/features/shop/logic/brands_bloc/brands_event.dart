import 'package:equatable/equatable.dart';

abstract class BrandsEvent extends Equatable {
  const BrandsEvent();

  @override
  List<Object?> get props => [];
}

class FetchBrands extends BrandsEvent {
  final String? departmentId;

  const FetchBrands({this.departmentId});

  @override
  List<Object?> get props => [departmentId];
}
