import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';

class SellScreen extends StatelessWidget {
  const SellScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: const Center(
        child: Text('Sell'),
      ),
    );
  }
}
