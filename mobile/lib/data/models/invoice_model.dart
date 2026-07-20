class InvoiceLineItem {
  final String name;
  final double unitPrice;
  final int quantity;
  final double subtotal;

  const InvoiceLineItem({
    required this.name,
    required this.unitPrice,
    required this.quantity,
    required this.subtotal,
  });

  factory InvoiceLineItem.fromJson(Map<String, dynamic> json) {
    return InvoiceLineItem(
      name: json['name'] as String,
      unitPrice: (json['unitPrice'] as num).toDouble(),
      quantity: json['quantity'] as int,
      subtotal: (json['subtotal'] as num).toDouble(),
    );
  }
}

class InvoiceAddress {
  final String street;
  final String city;
  final String state;
  final String zip;
  final String country;

  const InvoiceAddress({
    required this.street,
    required this.city,
    required this.state,
    required this.zip,
    required this.country,
  });

  factory InvoiceAddress.fromJson(Map<String, dynamic> json) {
    return InvoiceAddress(
      street: json['street'] as String? ?? '',
      city: json['city'] as String? ?? '',
      state: json['state'] as String? ?? '',
      zip: json['zip'] as String? ?? '',
      country: json['country'] as String? ?? '',
    );
  }
}

class InvoiceModel {
  final String invoiceNumber;
  final String issuedAt;
  final String orderStatus;
  final String paymentStatus;
  final String paymentMethod;
  final InvoiceAddress shippingAddress;
  final List<InvoiceLineItem> lineItems;
  final double subtotal;
  final double total;

  const InvoiceModel({
    required this.invoiceNumber,
    required this.issuedAt,
    required this.orderStatus,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.shippingAddress,
    required this.lineItems,
    required this.subtotal,
    required this.total,
  });

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    final order = json['order'] as Map<String, dynamic>? ?? {};
    final address = json['shippingAddress'] as Map<String, dynamic>? ?? {};
    final rawItems = json['lineItems'] as List<dynamic>? ?? [];

    return InvoiceModel(
      invoiceNumber: json['invoiceNumber'] as String? ?? '',
      issuedAt: json['issuedAt'] as String? ?? '',
      orderStatus: order['status'] as String? ?? '',
      paymentStatus: order['paymentStatus'] as String? ?? '',
      paymentMethod: order['paymentMethod'] as String? ?? '',
      shippingAddress: InvoiceAddress.fromJson(address),
      lineItems: rawItems
          .map((e) => InvoiceLineItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      subtotal: (json['subtotal'] as num).toDouble(),
      total: (json['total'] as num).toDouble(),
    );
  }
}
