import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:dio/dio.dart';
import 'package:dres/features/auth/data/models/auth_models.dart';
import 'package:dres/features/auth/data/repositories/auth_repository.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _authRepository;

  AuthBloc({required AuthRepository authRepository})
      : _authRepository = authRepository,
        super(const AuthState()) {
    on<AuthRegisterRequested>(_onRegisterRequested);
    on<AuthLoginRequested>(_onLoginRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
    on<AuthForgotPasswordRequested>(_onForgotPasswordRequested);
    on<AuthCheckStatusRequested>(_onCheckStatusRequested);
    on<AuthSetRedirect>(_onSetRedirect);
    on<AuthClearRedirect>(_onClearRedirect);
    on<AuthAppleSignInRequested>(_onAppleSignInRequested);
    on<AuthGoogleSignInRequested>(_onGoogleSignInRequested);
  }

  void _onSetRedirect(
    AuthSetRedirect event,
    Emitter<AuthState> emit,
  ) {
    debugPrint('🟡 AuthBloc: Setting redirectTo=${event.redirectTo}');
    emit(state.copyWith(redirectTo: event.redirectTo));
    debugPrint('🟡 AuthBloc: After emit, state.redirectTo=${state.redirectTo}');
  }

  void _onClearRedirect(
    AuthClearRedirect event,
    Emitter<AuthState> emit,
  ) {
    debugPrint('🟠 AuthBloc: Clearing redirectTo');
    emit(state.copyWith(clearRedirect: true));
  }

  Future<void> _onRegisterRequested(
    AuthRegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading));

    try {
      final request = RegisterRequest(
        firstName: event.firstName,
        lastName: event.lastName,
        shopName: event.shopName,
        email: event.email,
        password: event.password,
      );

      await _authRepository.register(request);
      
      // Logout the user so they need to verify email and login
      await _authRepository.logout();

      // Emit registration success (not authenticated - user needs to verify email)
      emit(state.copyWith(
        status: AuthStatus.registrationSuccess,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: _parseError(e),
      ));
    }
  }

  Future<void> _onLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading));

    try {
      final request = LoginRequest(
        email: event.email,
        password: event.password,
      );

      final response = await _authRepository.login(request);

      debugPrint('🟢 AuthBloc: Login successful, current redirectTo=${state.redirectTo}');
      emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: response.user,
      ));
      debugPrint('🟢 AuthBloc: After emit, state.redirectTo=${state.redirectTo}');
    } catch (e) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: _parseError(e),
      ));
    }
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading));

    try {
      // Logout from social providers (Google/Apple)
      await _authRepository.socialSignOut();
      // Logout from backend
      await _authRepository.logout();
      emit(state.copyWith(
        status: AuthStatus.unauthenticated,
        user: null,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: AuthStatus.unauthenticated,
        user: null,
      ));
    }
  }

  Future<void> _onForgotPasswordRequested(
    AuthForgotPasswordRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading));

    try {
      await _authRepository.forgotPassword(event.email);
      emit(state.copyWith(
        status: AuthStatus.unauthenticated,
        forgotPasswordSuccess: true,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: _parseError(e),
      ));
    }
  }

  Future<void> _onCheckStatusRequested(
    AuthCheckStatusRequested event,
    Emitter<AuthState> emit,
  ) async {
    // If we already have user data and are authenticated, don't reload
    if (state.status == AuthStatus.authenticated && state.user != null) {
      debugPrint('🔵 AuthBloc: Already authenticated with user, skipping check');
      return;
    }
    
    emit(state.copyWith(status: AuthStatus.loading));

    try {
      final isLoggedIn = await _authRepository.isLoggedIn();
      debugPrint('🔵 AuthBloc: isLoggedIn = $isLoggedIn');
      
      if (isLoggedIn) {
        final user = await _authRepository.getCurrentUser();
        debugPrint('🔵 AuthBloc: getCurrentUser returned user: ${user?.id}');
        if (user != null) {
          debugPrint('🟢 AuthBloc: Emitting authenticated state with user: ${user.id}');
          emit(state.copyWith(
            status: AuthStatus.authenticated,
            user: user,
          ));
          debugPrint('🟢 AuthBloc: State emitted, current user: ${state.user?.id}');
        } else {
          // If we have an existing user but getCurrentUser failed, keep the existing user
          if (state.user != null) {
            debugPrint('🔵 AuthBloc: getCurrentUser returned null but we have existing user, keeping it');
            emit(state.copyWith(status: AuthStatus.authenticated));
          } else {
            debugPrint('🔴 AuthBloc: No user found, emitting unauthenticated');
            emit(state.copyWith(status: AuthStatus.unauthenticated));
          }
        }
      } else {
        debugPrint('🔴 AuthBloc: Not logged in, emitting unauthenticated');
        emit(state.copyWith(status: AuthStatus.unauthenticated));
      }
    } catch (e) {
      debugPrint('🔴 AuthBloc: Error checking auth: $e');
      // If we have an existing user, keep them authenticated
      if (state.user != null) {
        emit(state.copyWith(status: AuthStatus.authenticated));
      } else {
        emit(state.copyWith(status: AuthStatus.unauthenticated));
      }
    }
  }

  String _parseError(dynamic error) {
    // Handle DioException with response data
    if (error is DioException) {
      final response = error.response;
      if (response != null && response.data != null) {
        final data = response.data;
        
        // Check for Payload CMS error format
        if (data is Map<String, dynamic>) {
          // Check for errors array
          final errors = data['errors'] as List<dynamic>?;
          if (errors != null && errors.isNotEmpty) {
            final firstError = errors.first;
            if (firstError is Map<String, dynamic>) {
              final message = firstError['message'] as String?;
              final field = firstError['field'] as String? ?? firstError['name'] as String?;
              
              if (field == 'email') {
                if (message?.contains('unique') == true || 
                    message?.contains('already') == true ||
                    message?.contains('invalid') == true) {
                  return 'An account with this email already exists';
                }
                return 'Please enter a valid email address';
              }
              
              if (message != null) {
                return message;
              }
            }
          }
          
          // Check for message field directly
          final message = data['message'] as String?;
          if (message != null) {
            if (message.contains('email')) {
              return 'An account with this email already exists';
            }
            return message;
          }
        }
      }
      
      // Handle specific status codes
      if (response?.statusCode == 400) {
        return 'Invalid information provided. Please check your details.';
      }
      if (response?.statusCode == 401) {
        return 'Invalid email or password';
      }
      if (response?.statusCode == 403) {
        return 'Access denied. Please try again.';
      }
      if (response?.statusCode == 409) {
        return 'An account with this email already exists';
      }
    }
    
    // Fallback string matching
    final message = error.toString().toLowerCase();
    if (message.contains('email') && (message.contains('exist') || message.contains('unique') || message.contains('invalid'))) {
      return 'An account with this email already exists';
    }
    if (message.contains('invalid credentials') || message.contains('unauthorized')) {
      return 'Invalid email or password';
    }
    if (message.contains('network') || message.contains('connection') || message.contains('socket')) {
      return 'Network error. Please check your connection';
    }
    
    return 'Something went wrong. Please try again';
  }

  Future<void> _onAppleSignInRequested(
    AuthAppleSignInRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading));

    try {
      final response = await _authRepository.signInWithApple();
      
      debugPrint('🍎 AuthBloc: Apple Sign In successful');
      emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: response.user,
      ));
    } catch (e) {
      final errorMessage = e.toString();
      // Don't show error if user cancelled
      if (errorMessage.contains('cancelled') || errorMessage.contains('canceled')) {
        emit(state.copyWith(status: AuthStatus.initial));
        return;
      }
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: _parseError(e),
      ));
    }
  }

  Future<void> _onGoogleSignInRequested(
    AuthGoogleSignInRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading));

    try {
      final response = await _authRepository.signInWithGoogle();
      
      debugPrint('🔵 AuthBloc: Google Sign In successful');
      emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: response.user,
      ));
    } catch (e) {
      final errorMessage = e.toString();
      // Don't show error if user cancelled
      if (errorMessage.contains('cancelled') || errorMessage.contains('canceled')) {
        emit(state.copyWith(status: AuthStatus.initial));
        return;
      }
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: _parseError(e),
      ));
    }
  }
}
