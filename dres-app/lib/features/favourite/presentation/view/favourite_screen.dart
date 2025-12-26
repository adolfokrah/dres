import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';

class FavouriteScreen extends StatelessWidget {
  const FavouriteScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: const Center(
        child: Text('Favourite'),
      ),
    );
  }
}
