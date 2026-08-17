class AddressModel {
  final String id;
  final String label;
  final String street;
  final String city;
  final String state;
  final String zip;
  final String country;
  final bool isDefault;

  const AddressModel({
    required this.id,
    required this.label,
    required this.street,
    required this.city,
    required this.state,
    required this.zip,
    required this.country,
    required this.isDefault,
  });

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      id: json['_id'] as String,
      label: json['label'] as String? ?? 'Home',
      street: json['street'] as String,
      city: json['city'] as String,
      state: json['state'] as String,
      zip: json['zip'] as String,
      country: json['country'] as String,
      isDefault: json['isDefault'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'label': label,
        'street': street,
        'city': city,
        'state': state,
        'zip': zip,
        'country': country,
        'isDefault': isDefault,
      };

  String get oneLine => '$street, $city, $state $zip, $country';
}
