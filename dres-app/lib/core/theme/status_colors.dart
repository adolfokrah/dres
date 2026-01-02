import 'package:flutter/material.dart';

/// Status colors matching CMS styling for consistency.
/// 
/// Order Status Colors:
/// - completed: Green (#22c55e)
/// - in_progress: Blue (#3b82f6)  
/// - cancelled: Red (#ef4444)
/// - placed: Purple (#8b5cf6)
/// - new: Gray (#6b7280)
///
/// Shipping/Item Status Colors:
/// - delivered: Green (#22c55e)
/// - out_for_delivery: Blue (#3b82f6)
/// - returned: Red (#ef4444)
/// - return_in_progress: Orange (#f97316)
/// - not_available: Gray (#6b7280)
/// - placed: Purple (#8b5cf6)
///
/// Transaction Status Colors (solid backgrounds from design):
/// - pending: Yellow (#F4D39D)
/// - in_progress: Blue (#3b82f6)
/// - completed: Green (#ACF8BF)
/// - cancelled: Red (#F8ACAC)
class StatusColors {
  StatusColors._();

  // Base colors from CMS
  static const Color green = Color(0xFF22c55e);
  static const Color blue = Color(0xFF3b82f6);
  static const Color red = Color(0xFFef4444);
  static const Color purple = Color(0xFF8b5cf6);
  static const Color orange = Color(0xFFf97316);
  static const Color gray = Color(0xFF6b7280);

  /// Get order status color
  static Color getOrderStatusColor(String status) {
    switch (status) {
      case 'completed':
        return green;
      case 'in_progress':
        return blue;
      case 'cancelled':
        return red;
      case 'placed':
        return purple;
      case 'new':
      default:
        return gray;
    }
  }

  /// Get shipping/item status color
  static Color getShippingStatusColor(String status) {
    switch (status) {
      case 'delivered':
        return green;
      case 'out_for_delivery':
        return blue;
      case 'returned':
        return red;
      case 'return_in_progress':
        return orange;
      case 'not_available':
        return gray;
      case 'cancelled':
        return red;
      case 'placed':
      default:
        return purple;
    }
  }

  /// Get background color with 20% opacity (like CMS)
  static Color getBackgroundColor(Color color) {
    return color.withValues(alpha: 0.2);
  }

  /// Get transaction status color (same style as order statuses)
  static Color getTransactionStatusColor(String status) {
    switch (status) {
      case 'pending':
        return orange; // Orange for pending
      case 'in_progress':
        return blue;
      case 'completed':
        return green;
      case 'cancelled':
        return red;
      default:
        return gray;
    }
  }
}
