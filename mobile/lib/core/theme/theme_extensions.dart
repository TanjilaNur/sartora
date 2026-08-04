import 'package:flutter/material.dart';

/// Theme-aware color access. Use these instead of hardcoded `AppColors`
/// constants for anything that should flip between light and dark mode
/// (page/surface backgrounds, body text, borders). Brand/semantic colors
/// (`AppColors.primary`, `.secondary`, `.success`, `.danger`, `.warning`)
/// are intentionally the same in both themes and should stay as-is.
extension AppThemeColors on BuildContext {
  ColorScheme get colorScheme => Theme.of(this).colorScheme;

  /// Overall page/scaffold background.
  Color get pageBackground => Theme.of(this).scaffoldBackgroundColor;

  /// Card / sheet / dialog / input-fill background.
  Color get surfaceColor => colorScheme.surface;

  /// Primary body/heading text and icon color.
  Color get textPrimary => colorScheme.onSurface;

  /// Secondary/muted text, captions, and inactive icons.
  Color get textSecondary => colorScheme.onSurfaceVariant;

  /// Borders, dividers, unselected outlines.
  Color get borderColor => Theme.of(this).dividerColor;

  /// Tinted backdrop behind a primary-colored icon/badge (replaces the old
  /// fixed `AppColors.primaryLight`).
  Color get primaryTintBackground => colorScheme.primaryContainer;

  /// Icon/text color drawn on top of [primaryTintBackground].
  Color get onPrimaryTintBackground => colorScheme.onPrimaryContainer;
}
