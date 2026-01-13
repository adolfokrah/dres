import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dres/core/di/injection.dart';
import 'package:dres/features/saved_searches/logic/saved_searches_bloc/saved_searches_bloc.dart';
import 'package:dres/features/saved_searches/presentation/widgets/saved_search_card.dart';

class SavedSearchesScreen extends StatelessWidget {
  const SavedSearchesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: getIt<SavedSearchesBloc>(),
      child: const _SavedSearchesView(),
    );
  }
}

class _SavedSearchesView extends StatefulWidget {
  const _SavedSearchesView();

  @override
  State<_SavedSearchesView> createState() => _SavedSearchesViewState();
}

class _SavedSearchesViewState extends State<_SavedSearchesView> {
  @override
  void initState() {
    super.initState();
    context.read<SavedSearchesBloc>().add(const SavedSearchesFetchRequested());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Saved Searches'),
        actions: [
          IconButton(
            onPressed: () {
              context.read<SavedSearchesBloc>().add(const SavedSearchesRefreshRequested());
            },
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: BlocBuilder<SavedSearchesBloc, SavedSearchesState>(
        builder: (context, state) {
          if (state.status == SavedSearchesStatus.loading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (state.status == SavedSearchesStatus.failure) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Failed to load saved searches',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    state.errorMessage ?? 'Unknown error occurred',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      context.read<SavedSearchesBloc>().add(const SavedSearchesFetchRequested());
                    },
                    child: const Text('Try Again'),
                  ),
                ],
              ),
            );
          }

          if (state.searches.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.bookmark_border,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No saved searches yet',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Save your favorite searches to get notified when new items match your criteria.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              context.read<SavedSearchesBloc>().add(const SavedSearchesRefreshRequested());
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: state.searches.length,
              itemBuilder: (context, index) {
                final search = state.searches[index];
                return SavedSearchCard(
                  savedSearch: search,
                  onDelete: () {
                    _showDeleteConfirmation(context, search.id);
                  },
                  onToggleNotifications: (enabled) {
                    context.read<SavedSearchesBloc>().add(
                      SavedSearchNotificationsToggled(
                        searchId: search.id,
                        enabled: enabled,
                      ),
                    );
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context, String searchId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Saved Search'),
        content: const Text('Are you sure you want to delete this saved search?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              context.read<SavedSearchesBloc>().add(
                SavedSearchDeleteRequested(searchId),
              );
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}