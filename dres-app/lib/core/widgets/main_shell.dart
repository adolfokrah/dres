import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/widgets/app_bottom_nav_bar.dart';
import 'package:dres/core/services/scroll_to_top_service.dart';
import 'package:dres/core/services/storage_service.dart';
import 'package:dres/core/di/injection.dart';
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
  // Tabs that require authentication: Sell (2), Favourite (3), Profile (4)
  static const List<int> _protectedTabs = [2, 3, 4];

  Future<bool> _isLoggedIn() async {
    final storageService = getIt<StorageService>();
    return await storageService.isLoggedIn();
  }

  void _onBottomNavTap(int index) async {
    // Check if tab requires authentication
    if (_protectedTabs.contains(index)) {
      final isLoggedIn = await _isLoggedIn();
      if (!isLoggedIn) {
        // Navigate to auth screen
        if (mounted) {
          context.push('/auth');
        }
        return;
      }
    }

    final currentRoute = GoRouterState.of(context).uri.toString();
    final isSameTab = widget.navigationShell.currentIndex == index;
    
    debugPrint('🔵 Tab tapped: $index, Same tab: $isSameTab, Current route: $currentRoute');
    
    if (isSameTab) {
      // Check if we're on the initial route of this tab
      final initialRoutes = [
        AppRoutes.home,
        AppRoutes.discover, // Shop tab uses /discover route
        AppRoutes.sell,
        AppRoutes.favourite,
        AppRoutes.profile,
      ];
      
      final isOnInitialRoute = currentRoute == initialRoutes[index];
      
      debugPrint('🔵 Expected route: ${initialRoutes[index]}, Is initial: $isOnInitialRoute');
      
      if (isOnInitialRoute) {
        // Already on initial route - send notification to scroll to top
        debugPrint('🔝 MainShell: Sending ScrollToTopNotification for tab $index');
        ScrollToTopService.instance.notifyScrollToTop(index);
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
      body: NotificationListener<ScrollToTopNotification>(
        onNotification: (notification) {
          debugPrint('🎯 MainShell body: Notification passed through');
          return false; // Let it bubble up to the screens
        },
        child: widget.navigationShell,
      ),
      bottomNavigationBar: AppBottomNavBar(
        currentIndex: widget.navigationShell.currentIndex,
        onTap: _onBottomNavTap,
      ),
    );
  }
}
