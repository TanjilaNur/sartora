class BadgeCriteria {
  final String type;
  final int value;

  const BadgeCriteria({required this.type, required this.value});

  factory BadgeCriteria.fromJson(Map<String, dynamic> json) {
    return BadgeCriteria(
      type: (json['type'] ?? '').toString(),
      value: (json['value'] as num?)?.toInt() ?? 0,
    );
  }
}

class BadgeModel {
  final String id;
  final String key;
  final String name;
  final String description;
  final String icon;
  final BadgeCriteria criteria;

  const BadgeModel({
    required this.id,
    required this.key,
    required this.name,
    required this.description,
    required this.icon,
    required this.criteria,
  });

  factory BadgeModel.fromJson(Map<String, dynamic> json) {
    return BadgeModel(
      id: (json['_id'] ?? '').toString(),
      key: (json['key'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      icon: (json['icon'] ?? '').toString(),
      criteria: BadgeCriteria.fromJson(
          (json['criteria'] as Map<String, dynamic>?) ?? {}),
    );
  }
}

class EarnedBadge {
  final BadgeModel badge;
  final DateTime earnedAt;

  const EarnedBadge({required this.badge, required this.earnedAt});

  factory EarnedBadge.fromJson(Map<String, dynamic> json) {
    final badgeData = json['badge'];
    return EarnedBadge(
      badge: BadgeModel.fromJson(
          badgeData is Map<String, dynamic> ? badgeData : {}),
      earnedAt: json['earnedAt'] != null
          ? DateTime.tryParse(json['earnedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class LeaderboardEntry {
  final int rank;
  final String userId;
  final String? name;
  final int points;

  const LeaderboardEntry({
    required this.rank,
    required this.userId,
    this.name,
    required this.points,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      rank: (json['rank'] as num?)?.toInt() ?? 0,
      userId: (json['userId'] ?? '').toString(),
      name: json['name']?.toString(),
      points: (json['points'] as num?)?.toInt() ?? 0,
    );
  }
}
