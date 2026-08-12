import 'package:flutter/material.dart';

final _hexPattern = RegExp(r'^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$');

/// Parses a hex color string (e.g. "#FF0000") into a [Color], or returns
/// null if it isn't a valid hex color — e.g. a variant created before the
/// admin's color field was a picker, which stores a plain name like "Black".
/// Callers use the null case to fall back to showing that name as text.
Color? tryParseHexColor(String? hex) {
  if (hex == null) return null;
  final cleaned = hex.trim().replaceFirst('#', '');
  if (!_hexPattern.hasMatch(cleaned)) return null;
  final argb = cleaned.length == 6 ? 'FF$cleaned' : cleaned;
  return Color(int.parse(argb, radix: 16));
}
