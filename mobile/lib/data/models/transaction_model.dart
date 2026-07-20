class TransactionModel {
  final String orderId;
  final String stripePaymentIntentId;
  final int amount;
  final String currency;
  final String status;
  final DateTime createdAt;

  const TransactionModel({
    required this.orderId,
    required this.stripePaymentIntentId,
    required this.amount,
    required this.currency,
    required this.status,
    required this.createdAt,
  });

  double get amountInDollars => amount / 100.0;

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      orderId: json['orderId']?.toString() ?? '',
      stripePaymentIntentId: json['stripePaymentIntentId'] as String? ?? '',
      amount: (json['amount'] as num?)?.toInt() ?? 0,
      currency: json['currency'] as String? ?? 'usd',
      status: json['status'] as String? ?? 'pending',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
