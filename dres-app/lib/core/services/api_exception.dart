import 'package:dio/dio.dart';

/// Custom exception for API errors with user-friendly messages
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  ApiException({
    required this.message,
    this.statusCode,
    this.data,
  });

  /// Create an ApiException from a DioException
  factory ApiException.fromDioException(DioException e) {
    final response = e.response;
    final statusCode = response?.statusCode;
    final data = response?.data;

    // Try to extract error message from response
    String message = _extractErrorMessage(data);

    // If no message found, use default messages based on error type
    if (message.isEmpty) {
      message = _getDefaultMessage(e, statusCode);
    }

    return ApiException(
      message: message,
      statusCode: statusCode,
      data: data,
    );
  }

  /// Extract error message from response data
  static String _extractErrorMessage(dynamic data) {
    if (data == null) return '';

    if (data is Map<String, dynamic>) {
      // Check for 'error' field (our custom endpoints format)
      if (data['error'] != null) {
        return data['error'].toString();
      }

      // Check for Payload CMS 'errors' array format FIRST
      // (Payload may include a generic top-level 'message' but specific error in 'errors' array)
      final errors = data['errors'] as List<dynamic>?;
      if (errors != null && errors.isNotEmpty) {
        final firstError = errors.first;
        if (firstError is Map<String, dynamic>) {
          final errorMessage = firstError['message'] as String?;
          if (errorMessage != null) {
            return errorMessage;
          }
        }
        // Handle string errors
        if (firstError is String) {
          return firstError;
        }
      }

      // Check for 'message' field (fallback)
      if (data['message'] != null) {
        return data['message'].toString();
      }
    }

    // If data is a string, use it directly
    if (data is String && data.isNotEmpty) {
      return data;
    }

    return '';
  }

  /// Get default error message based on error type
  static String _getDefaultMessage(DioException e, int? statusCode) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
        return 'Connection timed out. Please check your internet connection.';
      case DioExceptionType.sendTimeout:
        return 'Request timed out. Please try again.';
      case DioExceptionType.receiveTimeout:
        return 'Server took too long to respond. Please try again.';
      case DioExceptionType.connectionError:
        return 'Unable to connect. Please check your internet connection.';
      case DioExceptionType.cancel:
        return 'Request was cancelled.';
      case DioExceptionType.badResponse:
        return _getStatusCodeMessage(statusCode);
      case DioExceptionType.badCertificate:
        return 'Security certificate error. Please try again later.';
      case DioExceptionType.unknown:
        return 'Something went wrong. Please try again.';
    }
  }

  /// Get message based on HTTP status code
  static String _getStatusCodeMessage(int? statusCode) {
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You don\'t have permission to do this.';
      case 404:
        return 'Not found.';
      case 409:
        return 'Conflict with existing data.';
      case 422:
        return 'Invalid data provided.';
      case 429:
        return 'Too many requests. Please wait a moment.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
        return 'Service temporarily unavailable.';
      case 503:
        return 'Service is currently unavailable. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  @override
  String toString() => message;
}

/// Utility function to extract user-friendly error message from any error
String getErrorMessage(dynamic error) {
  if (error is ApiException) {
    return error.message;
  }
  
  if (error is DioException) {
    // Check if the error object is an ApiException
    if (error.error is ApiException) {
      return (error.error as ApiException).message;
    }
    // Check if message was set by our interceptor
    if (error.message != null && error.message!.isNotEmpty) {
      // Avoid showing raw Dio messages like "The connection errored"
      if (!error.message!.contains('DioException') && 
          !error.message!.contains('connection errored') &&
          !error.message!.contains('SocketException')) {
        return error.message!;
      }
    }
    // Fallback to creating ApiException from it
    return ApiException.fromDioException(error).message;
  }
  
  // Handle generic exceptions
  final errorString = error.toString();
  
  // Clean up exception prefixes
  if (errorString.startsWith('Exception: ')) {
    return errorString.substring(11);
  }
  
  // Don't show raw DioException text
  if (errorString.contains('DioException') || 
      errorString.contains('SocketException') ||
      errorString.contains('connection errored')) {
    return 'Something went wrong. Please try again.';
  }
  
  return errorString;
}
