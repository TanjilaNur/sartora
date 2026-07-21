class ContactModel {
  final String id;
  final String name;
  final String email;
  final String subject;
  final String message;
  final String status;
  final String reply;
  final DateTime createdAt;

  const ContactModel({
    required this.id,
    required this.name,
    required this.email,
    required this.subject,
    required this.message,
    required this.status,
    required this.reply,
    required this.createdAt,
  });

  factory ContactModel.fromJson(Map<String, dynamic> json) {
    return ContactModel(
      id: (json['_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      subject: (json['subject'] ?? '').toString(),
      message: (json['message'] ?? '').toString(),
      status: (json['status'] ?? 'open').toString(),
      reply: (json['reply'] ?? '').toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
