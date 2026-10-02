import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class AppTheme {
  static const _darkSurface = Color(0xFF1F2937);
  static const _darkBackground = Color(0xFF111827);
  static const _darkAppBar = Color(0xFF1E1B4B);
  static const _darkSubtext = Color(0xFF9CA3AF);
  static const _darkOutline = Color(0xFF374151);
  static const _darkPrimaryContainer = Color(0xFF472138);
  static const _darkOnPrimaryContainer = Color(0xFFF0B8CE);

  static ThemeData get light => ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          brightness: Brightness.light,
        ).copyWith(
          primary: AppColors.primary,
          surface: AppColors.white,
          onSurface: AppColors.neutral900,
          onSurfaceVariant: AppColors.neutral600,
          outline: AppColors.neutral300,
          surfaceContainerHighest: AppColors.neutral100,
          primaryContainer: AppColors.primaryLight,
          onPrimaryContainer: AppColors.primary,
        ),
        scaffoldBackgroundColor: AppColors.neutral100,
        fontFamily: 'Inter',
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.white,
          iconTheme: IconThemeData(color: AppColors.white),
          elevation: 0,
          titleTextStyle: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
            fontSize: 20,
          ),
        ),
        cardTheme: CardThemeData(
          color: AppColors.white,
          elevation: 1,
          shadowColor: Colors.black.withValues(alpha: 0.08),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: AppColors.white,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.neutral600,
          elevation: 8,
        ),
        dividerColor: AppColors.neutral300,
        switchTheme: SwitchThemeData(
          thumbColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) return AppColors.primary;
            return Colors.grey.shade400;
          }),
          trackColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return AppColors.primaryLight;
            }
            return Colors.grey.withValues(alpha: 0.3);
          }),
        ),
        listTileTheme: const ListTileThemeData(
          iconColor: AppColors.neutral600,
          textColor: AppColors.neutral900,
        ),
      );

  static ThemeData get dark => ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          brightness: Brightness.dark,
        ).copyWith(
          primary: AppColors.primary,
          surface: _darkSurface,
          onSurface: Colors.white,
          onSurfaceVariant: _darkSubtext,
          outline: _darkOutline,
          surfaceContainerHighest: _darkBackground,
          primaryContainer: _darkPrimaryContainer,
          onPrimaryContainer: _darkOnPrimaryContainer,
        ),
        scaffoldBackgroundColor: _darkBackground,
        fontFamily: 'Inter',
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: _darkAppBar,
          foregroundColor: Colors.white,
          iconTheme: IconThemeData(color: Colors.white),
          elevation: 0,
          titleTextStyle: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
            fontSize: 20,
          ),
        ),
        cardTheme: CardThemeData(
          color: _darkSurface,
          elevation: 1,
          shadowColor: Colors.black.withValues(alpha: 0.3),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: _darkSurface,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: _darkSubtext,
          elevation: 8,
        ),
        dividerColor: _darkOutline,
        switchTheme: SwitchThemeData(
          thumbColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) return AppColors.primary;
            return Colors.grey.shade600;
          }),
          trackColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return AppColors.primary.withValues(alpha: 0.4);
            }
            return Colors.grey.withValues(alpha: 0.2);
          }),
        ),
        listTileTheme: const ListTileThemeData(
          iconColor: _darkSubtext,
          textColor: Colors.white,
        ),
      );
}
