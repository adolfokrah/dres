import 'dart:async';
import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/payment/data/repositories/payment_repository.dart';

/// Result from payment webview
enum PaymentResult {
  success, // Payment completed successfully
  failed, // Payment failed
  closed, // User closed the WebView manually (will verify)
}

/// In-app browser screen for payments (Paystack, etc.)
/// 
/// Usage:
/// ```dart
/// final result = await openPaymentScreen(
///   context,
///   paymentUrl: 'https://checkout.paystack.com/...',
///   transactionId: 'TXN-123456',
///   title: 'Pay for Order #123',
///   onSuccess: () {
///     context.push('/orders/$orderId');
///   },
///   onFailure: () {
///     ScaffoldMessenger.of(context).showSnackBar(...);
///   },
/// );
/// ```
class PaymentScreen extends StatefulWidget {
  final String paymentUrl;
  final String transactionId;
  final String? title;
  final VoidCallback? onSuccess;
  final VoidCallback? onFailure;
  final VoidCallback? onClosed;

  const PaymentScreen({
    super.key,
    required this.paymentUrl,
    required this.transactionId,
    this.title,
    this.onSuccess,
    this.onFailure,
    this.onClosed,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  late final WebViewController _controller;
  late final PaymentRepository _paymentRepository;
  bool _isLoading = true;
  bool _hasHandledResult = false;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _paymentRepository = getIt<PaymentRepository>();
    _initWebView();
    _startPolling();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  /// Poll to check transaction status from database
  void _startPolling() {
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      if (_hasHandledResult) {
        timer.cancel();
        return;
      }

      try {
        final response = await _paymentRepository.checkTransactionStatus(
          reference: widget.transactionId,
        );

        debugPrint('🔄 Poll: status=${response.status}, success=${response.success}');

        if (!_hasHandledResult) {
          if (response.isPaymentSuccessful) {
            _closeWithResult(PaymentResult.success);
          } else if (response.isPaymentFailed) {
            _closeWithResult(PaymentResult.failed);
          }
          // Keep polling if pending
        }
      } catch (e) {
        debugPrint('🔄 Poll error: $e');
        // Continue polling on error
      }
    });
  }

  void _initWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            debugPrint('🌐 WebView navigating to: $url');
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (String url) {
            debugPrint('🌐 WebView finished loading: $url');
            setState(() {
              _isLoading = false;
            });
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('🌐 WebView error: ${error.description}');
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.paymentUrl));
  }

  void _closeWithResult(PaymentResult result) {
    if (_hasHandledResult) return;
    _hasHandledResult = true;
    _pollTimer?.cancel();
    debugPrint('🌐 Closing payment with result: $result');
    
    if (mounted) {
      Navigator.of(context).pop(result);
      
      // Execute callbacks after popping
      switch (result) {
        case PaymentResult.success:
          widget.onSuccess?.call();
          break;
        case PaymentResult.failed:
          widget.onFailure?.call();
          break;
        case PaymentResult.closed:
          widget.onClosed?.call();
          break;
      }
    }
  }

  void _onClose() {
    if (_hasHandledResult) return;

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
        backgroundColor: Colors.white,
        title: const Text(
          'Cancel Payment?',
          style: TextStyle(
            fontFamily: 'HelveticaNowText',
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        content: const Text(
          'Are you sure you want to cancel? Your order will be cancelled.',
          style: TextStyle(
            fontFamily: 'HelveticaNowText',
            fontSize: 16,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text(
              'Continue Paying',
              style: TextStyle(
                fontFamily: 'HelveticaNowText',
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(dialogContext).pop(); // Close dialog

              // Cancel the transaction and order on the backend
              try {
                await _paymentRepository.cancelTransaction(
                  reference: widget.transactionId,
                );
                debugPrint('🌐 Transaction cancelled successfully');
              } catch (e) {
                debugPrint('🌐 Failed to cancel transaction: $e');
                // Continue closing even if cancel fails
              }

              _closeWithResult(PaymentResult.closed);
            },
            child: const Text(
              'Cancel Order',
              style: TextStyle(
                fontFamily: 'HelveticaNowText',
                fontSize: 16,
                color: Colors.red,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          _onClose();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.title ?? 'Complete Payment'),
          leading: IconButton(
            icon: PhosphorIcon(PhosphorIconsRegular.x),
            onPressed: _onClose,
          ),
          actions: [
            if (_isLoading)
              const Padding(
                padding: EdgeInsets.all(16.0),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
          ],
        ),
        body: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_isLoading)
              const Center(
                child: CircularProgressIndicator(),
              ),
          ],
        ),
      ),
    );
  }
}

/// Helper function to open payment screen
/// 
/// Returns [PaymentResult] indicating the outcome.
/// Callbacks are optional and will be called after the screen is closed.
Future<PaymentResult?> openPaymentScreen(
  BuildContext context, {
  required String paymentUrl,
  required String transactionId,
  String? title,
  VoidCallback? onSuccess,
  VoidCallback? onFailure,
  VoidCallback? onClosed,
}) async {
  return Navigator.of(context).push<PaymentResult>(
    MaterialPageRoute(
      builder: (context) => PaymentScreen(
        paymentUrl: paymentUrl,
        transactionId: transactionId,
        title: title,
        onSuccess: onSuccess,
        onFailure: onFailure,
        onClosed: onClosed,
      ),
    ),
  );
}
