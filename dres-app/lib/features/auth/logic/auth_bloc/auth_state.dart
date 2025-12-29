part of 'auth_bloc.dart';

enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  error,
}

class AuthState extends Equatable {
  final AuthStatus status;
  final AuthUser? user;
  final String? errorMessage;
  final bool forgotPasswordSuccess;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.errorMessage,
    this.forgotPasswordSuccess = false,
  });

  AuthState copyWith({
    AuthStatus? status,
    AuthUser? user,
    String? errorMessage,
    bool? forgotPasswordSuccess,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage,
      forgotPasswordSuccess: forgotPasswordSuccess ?? this.forgotPasswordSuccess,
    );
  }

  @override
  List<Object?> get props => [status, user, errorMessage, forgotPasswordSuccess];
}
