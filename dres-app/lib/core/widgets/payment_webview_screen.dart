import 'dart:async';
import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/orders/data/repositories/orders_repository.dart';

/// Result from payment webview
enum PaymentResult {
  success, // Payment completed successfully
  failed, // Payment failed
  closed, // User closed the WebView manually (will verify)
}

/// In-app browser screen for Paystack payment
class PaymentWebViewScreen extends StatefulWidget {
  final String paymentUrl;
  final String? orderId;
  final String? transactionId;

  const PaymentWebViewScreen({
    super.key,
    required this.paymentUrl,
    this.orderId,
    this.transactionId,
  });

  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _hasHandledResult = false;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _initWebView();
    // Start polling for transaction status
    if (widget.transactionId != null) {
      _startPolling();
    }
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
        final response = await getIt<OrdersRepository>().checkTransactionStatus(
          reference: widget.transactionId!,
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
    debugPrint('🌐 Closing with result: $result');
    if (mounted) {
      Navigator.of(context).pop(result);
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
          'Close Payment?',
          style: TextStyle(
            fontFamily: 'HelveticaNowText',
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        content: const Text(
          'Are you sure you want to close? We\'ll check your payment status.',
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
            onPressed: () {
              Navigator.of(dialogContext).pop(); // Close dialog
              _closeWithResult(PaymentResult.closed);
            },
            child: const Text(
              'Close',
              style: TextStyle(
                fontFamily: 'HelveticaNowText',
                fontSize: 16,
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
          title: Text(widget.orderId != null 
              ? 'Pay for ${widget.orderId}' 
              : 'Complete Payment'),
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

/// Helper function to open payment webview
Future<PaymentResult?> openPaymentWebView(
  BuildContext context, {
  required String paymentUrl,
  String? orderId,
  String? transactionId,
}) async {
  return Navigator.of(context).push<PaymentResult>(
    MaterialPageRoute(
      builder: (context) => PaymentWebViewScreen(
        paymentUrl: paymentUrl,
        orderId: orderId,
        transactionId: transactionId,
      ),
    ),
  );
}
