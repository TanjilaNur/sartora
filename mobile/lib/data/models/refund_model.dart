class RefundModel {
  final String id;
  final String orderId;
  final String reason;
  final String status;
  final String? adminNote;
  final DateTime? createdAt;

  const RefundModel({
    required this.id,
    required this.orderId,
    required this.reason,
    required this.status,
    this.adminNote,
    this.createdAt,
  });

  factory RefundModel.fromJson(Map<String, dynamic> json) {
    DateTime? createdAt;
    if (json['createdAt'] != null) {
      createdAt = DateTime.tryParse(json['createdAt'] as String);
    }
    return RefundModel(
      id: json['_id'] as String? ?? '',
      orderId: (json['order'] is String
          ? json['order'] as String
          : (json['order'] as Map<String, dynamic>?)?['_id'] as String? ?? ''),
      reason: json['reason'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      adminNote: json['adminNote'] as String?,
      createdAt: createdAt,
    );
  }
}
