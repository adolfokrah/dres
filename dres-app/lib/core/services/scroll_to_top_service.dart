import 'dart:async';

/// Service to handle scroll to top notifications across the app
class ScrollToTopService {
  ScrollToTopService._();
  
  static final ScrollToTopService instance = ScrollToTopService._();
  
  final _controller = StreamController<int>.broadcast();
  
  /// Stream of tab indices that should scroll to top
  Stream<int> get scrollToTopStream => _controller.stream;
  
  /// Notify that a tab should scroll to top
  void notifyScrollToTop(int tabIndex) {
    _controller.add(tabIndex);
  }
  
  void dispose() {
    _controller.close();
  }
}
