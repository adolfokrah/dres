import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// Result from payment webview
enum PaymentResult {
  success,
  cancelled,
  failed,
}

/// In-app browser screen for Paystack payment
class PaymentWebViewScreen extends StatefulWidget {
  final String paymentUrl;
  final String? callbackUrl;
  final String? orderId;

  const PaymentWebViewScreen({
    super.key,
    required this.paymentUrl,
    this.callbackUrl,
    this.orderId,
  });

  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initWebView();
  }

  void _initWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
            _checkPaymentStatus(url);
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
          },
          onNavigationRequest: (NavigationRequest request) {
            // Check if this is a callback/redirect URL indicating payment completion
            if (_isPaymentCallback(request.url)) {
              _handlePaymentCallback(request.url);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('WebView error: ${error.description}');
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.paymentUrl));
  }

  bool _isPaymentCallback(String url) {
    // Check for common Paystack callback patterns
    final uri = Uri.tryParse(url);
    if (uri == null) return false;

    // Check if URL contains payment reference or trxref
    final hasReference = uri.queryParameters.containsKey('reference') ||
        uri.queryParameters.containsKey('trxref');

    // Check if it's a callback URL (your app's domain or localhost)
    final isCallback = url.contains('callback') ||
        url.contains('verify') ||
        url.contains('payment-complete') ||
        (widget.callbackUrl != null && url.startsWith(widget.callbackUrl!));

    return hasReference || isCallback;
  }

  void _checkPaymentStatus(String url) {
    // Check URL for payment status indicators
    final uri = Uri.tryParse(url);
    if (uri == null) return;

    // Paystack typically redirects with reference parameter on success
    if (uri.queryParameters.containsKey('reference') ||
        uri.queryParameters.containsKey('trxref')) {
      _handlePaymentCallback(url);
    }
  }

  void _handlePaymentCallback(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return;

    final reference = uri.queryParameters['reference'] ??
        uri.queryParameters['trxref'];

    debugPrint('Payment callback received. Reference: $reference');

    // Close webview and return success with reference
    Navigator.of(context).pop(PaymentResult.success);
  }

  void _onClose() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Payment?'),
        content: const Text(
          'Are you sure you want to cancel this payment? Your order will remain pending.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Continue Payment'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop(); // Close dialog
              Navigator.of(context).pop(PaymentResult.cancelled); // Close webview
            },
            child: const Text('Cancel'),
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
            icon: const Icon(Icons.close),
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
  String? callbackUrl,
  String? orderId,
}) async {
  return Navigator.of(context).push<PaymentResult>(
    MaterialPageRoute(
      builder: (context) => PaymentWebViewScreen(
        paymentUrl: paymentUrl,
        callbackUrl: callbackUrl,
        orderId: orderId,
      ),
    ),
  );
}
