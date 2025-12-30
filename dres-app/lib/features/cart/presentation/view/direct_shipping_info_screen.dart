import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

/// Information screen explaining how direct shipping and OTP delivery works
class DirectShippingInfoScreen extends StatelessWidget {
  const DirectShippingInfoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: GestureDetector(
          onTap: () {
            if (context.canPop()) {
              context.pop();
            }
          },
          child: Icon(
            PhosphorIcons.caretLeft(),
            size: 20,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
        title: Text(
          'Direct Shipping',
          style: AppTypography.bodyL.copyWith(
            color: AppColors.textPrimary,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: AppColors.secondary,
            height: 1,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section 1: How Shipping Works
            Text(
              'How Shipping Works (Customer Guide)',
              style: AppTypography.bodyL.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Delivery Confirmation (OTP Code)',
              style: AppTypography.bodyL.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            
            // Bullet points
            _BulletPoint(
              text: "After your order is on the way, you'll receive a delivery code (OTP) by SMS or WhatsApp.",
            ),
            _BulletPoint(
              text: "When the courier arrives, show or tell the OTP to the rider.",
            ),
            _BulletPoint(
              text: "The item is handed over only after the correct OTP is confirmed.",
            ),
            _BulletPoint(
              text: "Once the OTP is used, delivery is marked as complete and the seller is paid.",
            ),
            
            const SizedBox(height: 16),
            
            // Warning
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('⚠️ ', style: TextStyle(fontSize: 16)),
                Expanded(
                  child: Text(
                    'Do not share your OTP until you have received and checked your item.',
                    style: AppTypography.bodyL.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 32),
            
            // Section 2: Why We Use a Delivery Code
            Text(
              'Why We Use a Delivery Code',
              style: AppTypography.bodyL.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            
            _CheckPoint(text: 'Confirms you received the item'),
            _CheckPoint(text: 'Prevents fake or missing deliveries'),
            _CheckPoint(text: 'Protects your payment until delivery is complete'),
            _CheckPoint(text: 'Makes deliveries faster and more secure'),
            
            const SizedBox(height: 32),
            
            // Section 3: Important Notes
            Text(
              'Important Notes',
              style: AppTypography.bodyL.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            
            Text(
              "If there's an issue with your item, do not share the OTP.",
              style: AppTypography.bodyL.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "Report any problems within 6 hours through the app.",
              style: AppTypography.bodyL.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "If the OTP is not used, your payment remains protected.",
              style: AppTypography.bodyL.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BulletPoint extends StatelessWidget {
  final String text;

  const _BulletPoint({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '•  ',
            style: AppTypography.bodyL.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
          Expanded(
            child: Text(
              text,
              style: AppTypography.bodyL.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CheckPoint extends StatelessWidget {
  final String text;

  const _CheckPoint({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('✅ ', style: TextStyle(fontSize: 16)),
          Expanded(
            child: Text(
              text,
              style: AppTypography.bodyL.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
