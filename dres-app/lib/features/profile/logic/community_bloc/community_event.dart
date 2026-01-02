import 'package:equatable/equatable.dart';

abstract class CommunityEvent extends Equatable {
  const CommunityEvent();

  @override
  List<Object?> get props => [];
}

/// Event to fetch community (followers/following)
class CommunityFetchRequested extends CommunityEvent {
  final String userId;
  final String filter; // 'followers' or 'following'

  const CommunityFetchRequested({required this.userId, required this.filter});

  @override
  List<Object?> get props => [userId, filter];
}

/// Event to load more community members
class CommunityLoadMoreRequested extends CommunityEvent {
  const CommunityLoadMoreRequested();
}

/// Event to refresh community
class CommunityRefreshRequested extends CommunityEvent {
  const CommunityRefreshRequested();
}

/// Event to change filter
class CommunityFilterChanged extends CommunityEvent {
  final String filter; // 'followers' or 'following'

  const CommunityFilterChanged({required this.filter});

  @override
  List<Object?> get props => [filter];
}
