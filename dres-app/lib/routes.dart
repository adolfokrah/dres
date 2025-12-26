import 'package:go_router/go_router.dart';
import 'package:dres/features/splash/splash.dart';

class AppRoutes {
  AppRoutes._();

  // Route paths
  static const String splash = '/splash';
  static const String home = '/home';

  // Router configuration
  static final GoRouter router = GoRouter(
    initialLocation: splash,
    routes: [
      GoRoute(
        path: splash,
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),
      // GoRoute(
      //   path: home,
      //   name: 'home',
      //   builder: (context, state) => const HomeScreen(),
      // ),
    ],
  );
}
