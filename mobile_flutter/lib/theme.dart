import 'package:flutter/material.dart';

class OceanTheme {
  // Issue #16 design tokens
  static const primary = Color(0xFF0D7E8A); // Teal
  static const secondary = Color(0xFF1A5FA8); // Blue
  static const background = Color(0xFFFFFFFF);
  static const surface = Color(0xFFF5F7FA);
  static const text = Color(0xFF1A2332);
  static const textSecondary = Color(0xFF64748B);
  static const accent = Color(0xFFE0F4F6); // Light Teal
  static const error = Color(0xFFEF4444);
  static const success = Color(0xFF10B981);
  static const warning = Color(0xFFF59E0B);

  // Status colors
  static const statusPending = Color(0xFFF59E0B);
  static const statusInProgress = Color(0xFF0D7E8A);
  static const statusSubmitted = Color(0xFF8B5CF6);
  static const statusApproved = Color(0xFF10B981);

  // Rating colors
  static const ratingGreen = Color(0xFF10B981);
  static const ratingAmber = Color(0xFFF59E0B);
  static const ratingRed = Color(0xFFEF4444);

  // Turnaround colors
  static const turnaroundGood = Color(0xFF10B981); // >4hr
  static const turnaroundWarn = Color(0xFFF59E0B); // 2-4hr
  static const turnaroundUrgent = Color(0xFFEF4444); // <2hr

  static Color statusColor(String status) {
    switch (status) {
      case 'pending':
        return statusPending;
      case 'in_progress':
        return statusInProgress;
      case 'submitted':
        return statusSubmitted;
      case 'approved':
        return statusApproved;
      case 'completed':
        return statusApproved;
      case 'rejected':
        return const Color(0xFFEF4444);
      case 'skipped':
        return const Color(0xFF6B7280);
      default:
        return const Color(0xFF6B7280);
    }
  }

  static Color ratingColor(int rating) {
    if (rating >= 5) return ratingGreen;
    if (rating >= 4) return ratingAmber;
    return ratingRed;
  }

  static ThemeData get themeData => ThemeData(
    colorScheme: ColorScheme.fromSeed(
      seedColor: primary,
      primary: primary,
      secondary: secondary,
      surface: background,
      error: error,
    ),
    useMaterial3: true,
    scaffoldBackgroundColor: surface,
    appBarTheme: const AppBarTheme(
      backgroundColor: primary,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primary,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: accent,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const TextStyle(
            color: primary,
            fontWeight: FontWeight.w600,
            fontSize: 12,
          );
        }
        return const TextStyle(color: textSecondary, fontSize: 12);
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const IconThemeData(color: primary);
        }
        return const IconThemeData(color: textSecondary);
      }),
    ),
    cardTheme: CardThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 2,
    ),
  );
}
