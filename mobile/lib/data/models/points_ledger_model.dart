class PointsLedgerModel {
  final String id;
  final String event;
  final int points;
  final String description;
  final DateTime createdAt;

  const PointsLedgerModel({
    required this.id,
    required this.event,
    required this.points,
    required this.description,
    required this.createdAt,
  });

  factory PointsLedgerModel.fromJson(Map<String, dynamic> json) {
    return PointsLedgerModel(
      id: (json['_id'] ?? '').toString(),
      event: (json['event'] ?? '').toString(),
      points: (json['points'] as num?)?.toInt() ?? 0,
      description: (json['description'] ?? '').toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
