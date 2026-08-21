class UserModel {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String role;
  final bool hasGoogleAccount;
  final bool notificationsEnabled;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    this.hasGoogleAccount = false,
    this.notificationsEnabled = true,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String? ?? '',
      role: json['role'] as String? ?? 'user',
      hasGoogleAccount: json['hasGoogleAccount'] as bool? ?? false,
      notificationsEnabled: json['notificationsEnabled'] as bool? ?? true,
    );
  }
}
