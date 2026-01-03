import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';
import 'package:dres/core/widgets/unified_header.dart';
import 'package:dres/core/models/menu_model.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_bloc.dart';
import 'package:dres/features/splash/logic/menu_bloc/menu_state.dart';
import 'package:dres/features/sell/presentation/view/select_category_screen.dart';

/// Screen to select a department (Men, Women, Kids)
/// First step in category selection flow
class SelectDepartmentScreen extends StatelessWidget {
  const SelectDepartmentScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            const UnifiedHeader.titleOnly(title: 'Select Department'),

            // Content
            Expanded(
              child: BlocBuilder<MenuBloc, MenuState>(
                builder: (context, state) {
                  if (state.status == MenuStatus.loading) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  if (state.status == MenuStatus.failure || state.menu == null) {
                    return Center(
                      child: Text(
                        'Failed to load departments',
                        style: AppTypography.bodyM.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    );
                  }

                  final departments = state.menu!.departments;

                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: departments.length,
                    itemBuilder: (context, index) {
                      final department = departments[index];
                      return _DepartmentItem(department: department);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DepartmentItem extends StatelessWidget {
  final DepartmentModel department;

  const _DepartmentItem({required this.department});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        InkWell(
          onTap: () async {
            // Navigate to collection selection and await result
            final result = await context.push<SelectedCategoryData>(
              '/sell/select-collection',
              extra: {
                'department': department,
              },
            );

            // If we got a result, pop back with it
            if (result != null && context.mounted) {
              context.pop(result);
            }
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  department.name,
                  style: AppTypography.bodyL.copyWith(
                    fontSize: 18,
                  ),
                ),
                PhosphorIcon(
                  PhosphorIconsRegular.caretRight,
                  color: AppColors.textSecondary,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
        Divider(
          height: 1,
          thickness: 1,
          color: AppColors.border.withValues(alpha: 0.2),
          indent: 20,
          endIndent: 20,
        ),
      ],
    );
  }
}
