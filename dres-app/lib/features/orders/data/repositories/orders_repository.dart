import 'dart:io';
import 'package:dio/dio.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/orders/data/models/order_model.dart';
import 'package:dres/features/orders/data/models/purchase_details_model.dart';
import 'package:dres/features/orders/data/models/verify_payment_response.dart';

export 'package:dres/features/orders/data/models/order_model.dart';
export 'package:dres/features/orders/data/models/purchase_details_model.dart';
export 'package:dres/features/orders/data/models/verify_payment_response.dart';

class OrdersRepository {
  final ApiService _apiService;

  OrdersRepository({required ApiService apiService}) : _apiService = apiService;

  /// Check transaction status from database (for polling)
  /// Does NOT call Paystack API - just checks our DB status
  Future<VerifyPaymentResponse> checkTransactionStatus({
    required String reference,
  }) async {
    final response = await _apiService.get(
      '/transactions/check-status',
      queryParameters: {'reference': reference},
    );
    return VerifyPaymentResponse.fromJson(response.data);
  }

  /// Fetch user's orders
  Future<List<OrderModel>> getOrders({
    int page = 1,
    int limit = 10,
    String? statusFilter,
  }) async {
    final queryParameters = <String, dynamic>{
      'page': page,
      'limit': limit,
      'sort': '-createdAt',
      'depth': 2,
    };

    // Add status filter if provided
    if (statusFilter != null && statusFilter.isNotEmpty) {
      queryParameters['where[status][equals]'] = statusFilter;
    }

    final response = await _apiService.get(
      '/orders',
      queryParameters: queryParameters,
    );
    final docs = response.data['docs'] as List<dynamic>? ?? [];
    return docs.map((json) => OrderModel.fromJson(json)).toList();
  }

  /// Fetch a single order by ID
  Future<OrderModel> getOrderById(String id) async {
    final response = await _apiService.get('/orders/$id?depth=3');
    return OrderModel.fromJson(response.data);
  }

  /// Fetch complete purchase details with grouped items and delivery codes
  Future<PurchaseDetailsModel> getPurchaseDetails(String orderId) async {
    final response = await _apiService.get('/orders/$orderId/purchase-details');
    return PurchaseDetailsModel.fromJson(response.data);
  }

  /// Request a return for an order item
  Future<void> requestReturn({
    required String orderId,
    required String itemId,
    required String reason,
    required File image,
  }) async {
    // First upload the image to media collection
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        image.path,
        filename: 'return_evidence_${DateTime.now().millisecondsSinceEpoch}.jpg',
      ),
    });

    final uploadResponse = await _apiService.post(
      '/media',
      data: formData,
    );
    final mediaId = uploadResponse.data['doc']['id'];

    // Then submit the return request
    await _apiService.post(
      '/orders/$orderId/return-item',
      data: {
        'itemId': itemId,
        'reason': reason,
        'returnImage': mediaId,
      },
    );
  }
}
