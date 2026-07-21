import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get/get.dart';

class ThemeController extends GetxController {
  final _storage = const FlutterSecureStorage();
  static const _key = 'dark_mode';

  final isDarkMode = false.obs;

  @override
  void onInit() {
    super.onInit();
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final saved = await _storage.read(key: _key);
    final dark = saved == 'true';
    isDarkMode.value = dark;
    Get.changeThemeMode(dark ? ThemeMode.dark : ThemeMode.light);
  }

  Future<void> toggleTheme() async {
    isDarkMode.value = !isDarkMode.value;
    await _storage.write(key: _key, value: isDarkMode.value.toString());
    Get.changeThemeMode(isDarkMode.value ? ThemeMode.dark : ThemeMode.light);
  }

  Future<void> setDarkMode(bool value) async {
    if (isDarkMode.value == value) return;
    isDarkMode.value = value;
    await _storage.write(key: _key, value: value.toString());
    Get.changeThemeMode(value ? ThemeMode.dark : ThemeMode.light);
  }
}
