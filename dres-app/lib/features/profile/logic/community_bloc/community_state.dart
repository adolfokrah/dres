import 'package:equatable/equatable.dart';
import 'package:dres/features/profile/data/models/follow_user_model.dart';

enum CommunityStatus { initial, loading, success, error }

class CommunityState extends Equatable {
  final CommunityStatus status;
  final List<FollowUserModel> users;
  final String? userId;
  final String filter; // 'followers' or 'following'
  final String? error;
  final bool hasMore;
  final int currentPage;

  const CommunityState({
    this.status = CommunityStatus.initial,
    this.users = const [],
    this.userId,
    this.filter = 'followers',
    this.error,
    this.hasMore = true,
    this.currentPage = 1,
  });

  CommunityState copyWith({
    CommunityStatus? status,
    List<FollowUserModel>? users,
    String? userId,
    String? filter,
    String? error,
    bool? hasMore,
    int? currentPage,
  }) {
    return CommunityState(
      status: status ?? this.status,
      users: users ?? this.users,
      userId: userId ?? this.userId,
      filter: filter ?? this.filter,
      error: error,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
    );
  }

  @override
  List<Object?> get props => [
        status,
        users,
        userId,
        filter,
        error,
        hasMore,
        currentPage,
      ];
}
