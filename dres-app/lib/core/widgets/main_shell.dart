import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/widgets/app_bottom_nav_bar.dart';
import 'package:dres/routes.dart';

class MainShell extends StatefulWidget {
  const MainShell({
    super.key,
    required this.navigationShell,
  });

  final StatefulNavigationShell navigationShell;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  void _onBottomNavTap(int index) {
    // If tapping the same tab, go to initial location
    if (widget.navigationShell.currentIndex == index) {
      widget.navigationShell.goBranch(
        index,
        initialLocation: true,
      );
    } else {
      // Different tab - just switch branch
      widget.navigationShell.goBranch(index);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: widget.navigationShell,
      bottomNavigationBar: AppBottomNavBar(
        currentIndex: widget.navigationShell.currentIndex,
        onTap: _onBottomNavTap,
      ),
    );
  }
}
