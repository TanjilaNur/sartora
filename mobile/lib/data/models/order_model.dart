class OrderAddressModel {
  final String street;
  final String city;
  final String state;
  final String zip;
  final String country;

  const OrderAddressModel({
    required this.street,
    required this.city,
    required this.state,
    required this.zip,
    required this.country,
  });

  factory OrderAddressModel.fromJson(Map<String, dynamic> json) {
    return OrderAddressModel(
      street: json['street'] as String? ?? '',
      city: json['city'] as String? ?? '',
      state: json['state'] as String? ?? '',
      zip: json['zip'] as String? ?? '',
      country: json['country'] as String? ?? '',
    );
  }
}

class OrderItemModel {
  final String name;
  final double price;
  final int quantity;
  final String? productId;
  final String? variantId;

  const OrderItemModel({
    required this.name,
    required this.price,
    required this.quantity,
    this.productId,
    this.variantId,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      name: json['name'] as String,
      price: (json['price'] as num).toDouble(),
      quantity: json['quantity'] as int,
      productId: json['product'] as String?,
      variantId: json['variant'] as String?,
    );
  }
}

class OrderModel {
  final String orderId;
  final double subtotal;
  final double discount;
  final String? promoCode;
  final double total;
  final List<OrderItemModel> items;
  final String status;
  final String paymentStatus;
  final OrderAddressModel? address;
  final String? paymentMethod;
  final DateTime? createdAt;
  final String? trackingNumber;
  final String? carrier;

  const OrderModel({
    required this.orderId,
    required this.subtotal,
    required this.discount,
    this.promoCode,
    required this.total,
    required this.items,
    required this.status,
    this.paymentStatus = 'unpaid',
    this.address,
    this.paymentMethod,
    this.createdAt,
    this.trackingNumber,
    this.carrier,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final raw = json['items'] as List<dynamic>? ?? [];
    final items = raw
        .map((e) => OrderItemModel.fromJson(e as Map<String, dynamic>))
        .toList();

    final addressRaw = json['address'] as Map<String, dynamic>?;
    final paymentDetailsRaw = json['paymentDetails'] as Map<String, dynamic>?;

    DateTime? createdAt;
    if (json['createdAt'] != null) {
      createdAt = DateTime.tryParse(json['createdAt'] as String);
    }

    return OrderModel(
      orderId: (json['orderId'] ?? json['_id'] ?? json['id']) as String,
      subtotal: (json['subtotal'] as num).toDouble(),
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      promoCode: json['promoCode'] as String?,
      total: (json['total'] as num).toDouble(),
      items: items,
      status: json['status'] as String? ?? 'pending',
      paymentStatus: json['paymentStatus'] as String? ?? 'unpaid',
      address: addressRaw != null ? OrderAddressModel.fromJson(addressRaw) : null,
      paymentMethod: paymentDetailsRaw?['method'] as String?,
      createdAt: createdAt,
      trackingNumber: json['trackingNumber'] as String?,
      carrier: json['carrier'] as String?,
    );
  }
}
