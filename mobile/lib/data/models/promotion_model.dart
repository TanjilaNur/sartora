class PromoValidation {
  final bool valid;
  final double discount;
  final double finalTotal;
  final String promoCode;
  final String type;
  final double value;

  const PromoValidation({
    required this.valid,
    required this.discount,
    required this.finalTotal,
    required this.promoCode,
    required this.type,
    required this.value,
  });

  factory PromoValidation.fromJson(Map<String, dynamic> json) {
    return PromoValidation(
      valid: (json['valid'] as bool?) ?? false,
      discount: (json['discount'] as num?)?.toDouble() ?? 0,
      finalTotal: (json['finalTotal'] as num?)?.toDouble() ?? 0,
      promoCode: (json['promoCode'] ?? '').toString(),
      type: (json['type'] ?? '').toString(),
      value: (json['value'] as num?)?.toDouble() ?? 0,
    );
  }
}
