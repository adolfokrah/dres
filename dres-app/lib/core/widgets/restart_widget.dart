import 'package:flutter/material.dart';
import 'package:dres/core/di/injection.dart';

/// Global key to access RestartWidget state from anywhere
final restartWidgetKey = GlobalKey<RestartWidgetState>();

/// A widget that allows restarting the app by resetting all dependencies
class RestartWidget extends StatefulWidget {
  final Widget child;

  RestartWidget({required this.child}) : super(key: restartWidgetKey);

  /// Restart the app - can be called from anywhere
  static Future<void> restartApp() async {
    debugPrint('🔄 RestartWidget.restartApp called');
    final state = restartWidgetKey.currentState;
    if (state != null) {
      debugPrint('🔄 Found RestartWidgetState, calling restart()');
      await state.restart();
    } else {
      debugPrint('❌ RestartWidgetState NOT found!');
    }
  }

  @override
  State<RestartWidget> createState() => RestartWidgetState();
}

class RestartWidgetState extends State<RestartWidget> {
  Key _key = UniqueKey();

  Future<void> restart() async {
    debugPrint('🔄 Resetting dependencies...');
    // Reset all dependencies
    await resetDependencies();
    
    debugPrint('🔄 Rebuilding widget tree...');
    // Rebuild entire widget tree
    setState(() {
      _key = UniqueKey();
    });
    debugPrint('🔄 Restart complete!');
  }

  @override
  Widget build(BuildContext context) {
    return KeyedSubtree(
      key: _key,
      child: widget.child,
    );
  }
}