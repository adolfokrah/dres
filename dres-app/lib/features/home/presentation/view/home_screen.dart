import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/widgets/app_header.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Header
            AppHeader(
              onNotificationTap: () {
                // TODO: Navigate to notifications
              },
              onCartTap: () {
                // TODO: Navigate to cart
              },
              onSearchTap: () {
                // TODO: Navigate to search/discover
              },
            ),
            
            // Content
            const Expanded(
              child: Center(
                child: Text('Home'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
