part of 'auth_bloc.dart';

enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  registrationSuccess,
  error,
}

class AuthState extends Equatable {
  final AuthStatus status;
  final AuthUser? user;
  final String? errorMessage;
  final bool forgotPasswordSuccess;
  final String? redirectTo;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.errorMessage,
    this.forgotPasswordSuccess = false,
    this.redirectTo,
  });

  AuthState copyWith({
    AuthStatus? status,
    AuthUser? user,
    String? errorMessage,
    bool? forgotPasswordSuccess,
    String? redirectTo,
    bool clearRedirect = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage,
      forgotPasswordSuccess: forgotPasswordSuccess ?? this.forgotPasswordSuccess,
      redirectTo: clearRedirect ? null : (redirectTo ?? this.redirectTo),
    );
  }

  @override
  List<Object?> get props => [status, user, errorMessage, forgotPasswordSuccess, redirectTo];
}
