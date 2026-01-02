import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/favorites/logic/favorites_bloc/favorites_bloc.dart';
import 'package:dres/features/auth/logic/auth_bloc/auth_bloc.dart';

/// A standalone favorite button widget that communicates with the favorites API.
/// 
/// Shows a solid black heart when favorited, outline when not.
/// Handles add/remove operations with optimistic updates.
class FavoriteButton extends StatelessWidget {
  /// The variation ID to favorite/unfavorite
  final String variationId;
  
  /// Size of the heart icon
  final double size;
  
  /// Color when favorited (solid heart)
  final Color favoritedColor;
  
  /// Color when not favorited (outline heart)
  final Color unfavoritedColor;
  
  /// Optional callback when favorite state changes
  final ValueChanged<bool>? onChanged;

  const FavoriteButton({
    super.key,
    required this.variationId,
    this.size = 22,
    this.favoritedColor = Colors.black,
    this.unfavoritedColor = Colors.black,
    this.onChanged,
  });

  void _toggleFavorite(BuildContext context, bool currentlyFavorited, bool isLoggedIn) {
    // Check if user is logged in
    if (!isLoggedIn) {
      // Show login prompt and navigate to auth
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please log in to add favorites'),
          duration: Duration(seconds: 2),
        ),
      );
      context.push('/auth');
      return;
    }

    // Dispatch toggle event - bloc handles optimistic update
    getIt<FavoritesBloc>().add(FavoritesToggleRequested(
      variationId: variationId,
      isFavorited: currentlyFavorited,
    ));

    onChanged?.call(!currentlyFavorited);
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      bloc: getIt<AuthBloc>(),
      builder: (context, authState) {
        final isLoggedIn = authState.user != null;
        
        return BlocBuilder<FavoritesBloc, FavoritesState>(
          bloc: getIt<FavoritesBloc>(),
          builder: (context, favoritesState) {
            final isFavorited = favoritesState.isFavorited(variationId);

            return GestureDetector(
              onTap: () => _toggleFavorite(context, isFavorited, isLoggedIn),
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.all(4.0),
                child: Icon(
                  isFavorited ? Icons.favorite : Icons.favorite_border,
                  color: isFavorited ? favoritedColor : unfavoritedColor,
                  size: size,
                ),
              ),
            );
          },
        );
      },
    );
  }
}
