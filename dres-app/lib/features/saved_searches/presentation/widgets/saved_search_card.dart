import 'package:flutter/material.dart';
import 'package:dres/features/saved_searches/data/models/saved_search_models.dart';

class SavedSearchCard extends StatelessWidget {
  const SavedSearchCard({
    super.key,
    required this.savedSearch,
    required this.onDelete,
    required this.onToggleNotifications,
  });

  final SavedSearchModel savedSearch;
  final VoidCallback onDelete;
  final ValueChanged<bool> onToggleNotifications;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        savedSearch.name ?? 'Unnamed Search',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _buildSearchDescription(),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  onSelected: (value) {
                    switch (value) {
                      case 'delete':
                        onDelete();
                        break;
                    }
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete, color: Colors.red),
                          SizedBox(width: 8),
                          Text('Delete'),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(
                  savedSearch.isActive ? Icons.bookmark : Icons.bookmark_border,
                  size: 16,
                  color: savedSearch.isActive ? Colors.blue : Colors.grey,
                ),
                const SizedBox(width: 4),
                Text(
                  savedSearch.isActive ? 'Active' : 'Inactive',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: savedSearch.isActive ? Colors.blue : Colors.grey,
                  ),
                ),
                const Spacer(),
                Row(
                  children: [
                    Icon(
                      Icons.notifications,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 4),
                    Switch(
                      value: savedSearch.notificationsEnabled,
                      onChanged: onToggleNotifications,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  Icons.access_time,
                  size: 14,
                  color: Colors.grey[500],
                ),
                const SizedBox(width: 4),
                Text(
                  'Created ${_formatDate(savedSearch.createdAt)}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[500],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _buildSearchDescription() {
    final searchData = savedSearch.searchData;
    final List<String> filters = [];

    if (searchData['departmentName'] != null) {
      filters.add('Department: ${searchData['departmentName']}');
    }
    if (searchData['collectionName'] != null) {
      filters.add('Collection: ${searchData['collectionName']}');
    }
    if (searchData['categoryName'] != null) {
      filters.add('Category: ${searchData['categoryName']}');
    }
    if (searchData['brandName'] != null) {
      filters.add('Brand: ${searchData['brandName']}');
    }
    if (searchData['minPrice'] != null || searchData['maxPrice'] != null) {
      final min = searchData['minPrice'];
      final max = searchData['maxPrice'];
      if (min != null && max != null) {
        filters.add('Price: \$${min} - \$${max}');
      } else if (min != null) {
        filters.add('Min Price: \$${min}');
      } else if (max != null) {
        filters.add('Max Price: \$${max}');
      }
    }

    if (filters.isEmpty) {
      return 'All products';
    }

    return filters.take(2).join(' • ') + (filters.length > 2 ? ' • ...' : '');
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 0) {
      return '${difference.inDays} days ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hours ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minutes ago';
    } else {
      return 'Just now';
    }
  }
}