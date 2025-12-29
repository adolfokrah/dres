part of 'auth_bloc.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class AuthRegisterRequested extends AuthEvent {
  final String firstName;
  final String lastName;
  final String? shopName;
  final String email;
  final String password;

  const AuthRegisterRequested({
    required this.firstName,
    required this.lastName,
    this.shopName,
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [firstName, lastName, shopName, email, password];
}

class AuthLoginRequested extends AuthEvent {
  final String email;
  final String password;

  const AuthLoginRequested({
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [email, password];
}

class AuthLogoutRequested extends AuthEvent {
  const AuthLogoutRequested();
}

class AuthForgotPasswordRequested extends AuthEvent {
  final String email;

  const AuthForgotPasswordRequested({required this.email});

  @override
  List<Object?> get props => [email];
}

class AuthCheckStatusRequested extends AuthEvent {
  const AuthCheckStatusRequested();
}

class AuthSetRedirect extends AuthEvent {
  final String? redirectTo;

  const AuthSetRedirect(this.redirectTo);

  @override
  List<Object?> get props => [redirectTo];
}

class AuthClearRedirect extends AuthEvent {
  const AuthClearRedirect();
}

class AuthAppleSignInRequested extends AuthEvent {
  const AuthAppleSignInRequested();
}

class AuthGoogleSignInRequested extends AuthEvent {
  const AuthGoogleSignInRequested();
}
