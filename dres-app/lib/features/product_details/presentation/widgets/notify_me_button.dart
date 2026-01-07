import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

class NotifyMeButton extends StatefulWidget {
  final String skuId;
  final String variationTitle;
  final String variationId;

  const NotifyMeButton({
    super.key,
    required this.skuId,
    required this.variationTitle,
    required this.variationId,
  });

  @override
  State<NotifyMeButton> createState() => _NotifyMeButtonState();
}

class _NotifyMeButtonState extends State<NotifyMeButton> {
  bool _isLoading = false;
  bool _isSubscribed = false;
  bool _isCheckingSubscription = true;

  @override
  void initState() {
    super.initState();
    _checkExistingSubscription();
  }

  @override
  void didUpdateWidget(NotifyMeButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Re-check if SKU changes
    if (oldWidget.skuId != widget.skuId) {
      _checkExistingSubscription();
    }
  }

  Future<void> _checkExistingSubscription() async {
    final authState = getIt<AuthBloc>().state;
    
    if (authState.status != AuthStatus.authenticated) {
      setState(() => _isCheckingSubscription = false);
      return;
    }

    try {
      final apiService = getIt<ApiService>();
      final response = await apiService.get(
        '/stock-notifications/check?skuId=${widget.skuId}',
      );
      
      if (mounted) {
        setState(() {
          _isSubscribed = response.data['isSubscribed'] == true;
          _isCheckingSubscription = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isCheckingSubscription = false);
      }
    }
  }

  Future<void> _subscribeToNotification() async {
    final authState = getIt<AuthBloc>().state;
    
    if (authState.status != AuthStatus.authenticated) {
      // Navigate to login with redirect back to this product
      final currentPath = '/products/${widget.variationId}?skuId=${widget.skuId}';
      context.push('/login?redirect=${Uri.encodeComponent(currentPath)}');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final apiService = getIt<ApiService>();
      await apiService.post('/stock-notifications/subscribe', data: {
        'skuId': widget.skuId,
      });

      setState(() {
        _isSubscribed = true;
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('We\'ll notify you when "${widget.variationTitle}" is back in stock'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to subscribe. Please try again.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: _isLoading || _isSubscribed || _isCheckingSubscription 
            ? null 
            : _subscribeToNotification,
        style: ElevatedButton.styleFrom(
          backgroundColor: _isSubscribed ? AppColors.success : AppColors.primary,
          disabledBackgroundColor: _isSubscribed ? AppColors.success : AppColors.disabled,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.zero,
          ),
        ),
        child: _isLoading || _isCheckingSubscription
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  PhosphorIcon(
                    _isSubscribed 
                        ? PhosphorIconsFill.bellRinging 
                        : PhosphorIconsRegular.bell,
                    color: Colors.white,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _isSubscribed ? 'We\'ll notify you' : 'Notify me when available',
                    style: AppTypography.bodyL.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
