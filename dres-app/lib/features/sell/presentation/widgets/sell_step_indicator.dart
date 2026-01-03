import 'package:flutter/material.dart';
import 'package:dres/core/theme/app_colors.dart';
import 'package:dres/core/theme/app_typography.dart';

/// Step indicator widget for the sell flow
/// Shows current step number, title, and progress bar
class SellStepIndicator extends StatelessWidget {
  final int currentStep;
  final int totalSteps;
  final String stepTitle;

  const SellStepIndicator({
    super.key,
    required this.currentStep,
    required this.totalSteps,
    required this.stepTitle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Step number and title
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: Row(
            children: [
              // Step number circle
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.textPrimary, width: 1),
                ),
                child: Center(
                  child: Text(
                    currentStep.toString(),
                    style: AppTypography.bodyS.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              // Step title
              Text(
                stepTitle,
                style: AppTypography.bodyM.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),

        // Progress bar
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: List.generate(totalSteps, (index) {
              final isCompleted = index < currentStep;
              return Expanded(
                child: Container(
                  height: 8,
                  margin: EdgeInsets.only(
                    right: index < totalSteps - 1 ? 10 : 0,
                  ),
                  color: isCompleted
                      ? AppColors.textPrimary
                      : AppColors.secondary,
                ),
              );
            }),
          ),
        ),
      ],
    );
  }
}
