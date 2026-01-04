import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:dres/core/services/storage_service.dart';
import 'package:dres/core/services/api_exception.dart';

export 'package:dres/core/services/api_exception.dart';

class ApiService {
  late final Dio _dio;
  final StorageService _storageService;

  ApiService(this._storageService) {
    _dio = Dio(
      BaseOptions(
        baseUrl: '${dotenv.env['NEXT_PUBLIC_SERVER_URL'] ?? 'http://localhost:3000'}/api',
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add interceptors
    _dio.interceptors.add(_createLogInterceptor());
    _dio.interceptors.add(_createAuthInterceptor());
    _dio.interceptors.add(_createErrorInterceptor());
  }

  Dio get dio => _dio;

  // Log interceptor for debugging
  InterceptorsWrapper _createLogInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) {
        print('🌐 REQUEST[${options.method}] => PATH: ${options.path}');
        print('Headers: ${options.headers}');
        if (options.data != null) {
          print('Data: ${options.data}');
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        print('✅ RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}');
        return handler.next(response);
      },
      onError: (DioException e, handler) {
        print('❌ ERROR[${e.response?.statusCode}] => PATH: ${e.requestOptions.path}');
        print('Message: ${e.message}');
        return handler.next(e);
      },
    );
  }

  // Auth interceptor for adding Payload CMS JWT tokens
  InterceptorsWrapper _createAuthInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Get token from storage and add to headers
        final token = await _storageService.getToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'JWT $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        // Handle 401 Unauthorized
        if (e.response?.statusCode == 401) {
          // Clear tokens on unauthorized
          await _storageService.deleteTokens();
          // TODO: Navigate to login screen or emit auth event
        }
        return handler.next(e);
      },
    );
  }

  // Error interceptor to convert DioException to ApiException
  InterceptorsWrapper _createErrorInterceptor() {
    return InterceptorsWrapper(
      onError: (DioException e, handler) {
        // Convert DioException to ApiException with user-friendly message
        final apiException = ApiException.fromDioException(e);
        
        // Create a new DioException with our custom error message
        final newException = DioException(
          requestOptions: e.requestOptions,
          response: e.response,
          type: e.type,
          error: apiException,
          message: apiException.message,
        );
        
        return handler.next(newException);
      },
    );
  }

  // GET request
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.get(path, queryParameters: queryParameters, options: options);
  }

  // POST request
  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.post(path, data: data, queryParameters: queryParameters, options: options);
  }

  // PUT request
  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.put(path, data: data, queryParameters: queryParameters, options: options);
  }

  // PATCH request
  Future<Response> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.patch(path, data: data, queryParameters: queryParameters, options: options);
  }

  // DELETE request
  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.delete(path, data: data, queryParameters: queryParameters, options: options);
  }

  // Upload file (multipart form data)
  Future<Response> uploadFile(
    String path, {
    required String filePath,
    String fieldName = 'file',
    Map<String, dynamic>? additionalFields,
    Options? options,
  }) async {
    final fileName = filePath.split('/').last;
    final formData = FormData.fromMap({
      fieldName: await MultipartFile.fromFile(filePath, filename: fileName),
      if (additionalFields != null) ...additionalFields,
    });
    
    return _dio.post(
      path,
      data: formData,
      options: options ?? Options(contentType: 'multipart/form-data'),
    );
  }
}
