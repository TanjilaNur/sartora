class ReviewModel {
  final String id;
  final String productId;
  final String userId;
  final String userName;
  final int rating;
  final String text;
  final bool verified;
  final bool reported;
  final DateTime createdAt;

  const ReviewModel({
    required this.id,
    required this.productId,
    required this.userId,
    required this.userName,
    required this.rating,
    required this.text,
    required this.verified,
    required this.reported,
    required this.createdAt,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'];
    String userId = '';
    String userName = 'Anonymous';
    if (user is Map<String, dynamic>) {
      userId = (user['_id'] ?? '').toString();
      userName = (user['name'] ?? user['email'] ?? 'Anonymous').toString();
    } else if (user is String) {
      userId = user;
    }

    return ReviewModel(
      id: (json['_id'] ?? '').toString(),
      productId: (json['product'] is Map<String, dynamic>
              ? (json['product'] as Map<String, dynamic>)['_id']
              : json['product'] ?? '')
          .toString(),
      userId: userId,
      userName: userName,
      rating: (json['rating'] as num?)?.toInt() ?? 0,
      text: (json['text'] ?? '').toString(),
      verified: (json['verified'] as bool?) ?? false,
      reported: (json['reported'] as bool?) ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
