import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/widgets/app_bottom_nav_bar.dart';
import 'package:dres/routes.dart';

// Notification to trigger scroll to top
class ScrollToTopNotification extends Notification {}

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
    final currentRoute = GoRouterState.of(context).uri.toString();
    final isSameTab = widget.navigationShell.currentIndex == index;
    
    if (isSameTab) {
      // Check if we're on the initial route of this tab
      final initialRoutes = [
        AppRoutes.home,
        AppRoutes.shop,
        AppRoutes.sell,
        AppRoutes.favourite,
        AppRoutes.profile,
      ];
      
      final isOnInitialRoute = currentRoute == initialRoutes[index];
      
      if (isOnInitialRoute) {
        // Already on initial route - send notification to scroll to top
        debugPrint('🔝 MainShell: Sending ScrollToTopNotification for tab $index');
        ScrollToTopNotification().dispatch(context);
      } else {
        // Not on initial route - go to initial route
        widget.navigationShell.goBranch(
          index,
          initialLocation: true,
        );
      }
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
