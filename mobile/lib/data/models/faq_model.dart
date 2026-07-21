class FaqModel {
  final String id;
  final String question;
  final String answer;
  final String category;
  final int order;
  final bool active;

  const FaqModel({
    required this.id,
    required this.question,
    required this.answer,
    required this.category,
    required this.order,
    required this.active,
  });

  factory FaqModel.fromJson(Map<String, dynamic> json) {
    return FaqModel(
      id: (json['_id'] ?? '').toString(),
      question: (json['question'] ?? '').toString(),
      answer: (json['answer'] ?? '').toString(),
      category: (json['category'] ?? 'General').toString(),
      order: (json['order'] as num?)?.toInt() ?? 0,
      active: (json['active'] as bool?) ?? true,
    );
  }
}
