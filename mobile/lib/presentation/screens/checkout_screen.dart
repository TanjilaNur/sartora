import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/cart_controller.dart';
import '../../controllers/payment_controller.dart';
import '../../controllers/profile_controller.dart';
import '../../controllers/promotion_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../../data/models/address_model.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _streetCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _stateCtrl = TextEditingController();
  final _zipCtrl = TextEditingController();
  final _countryCtrl = TextEditingController(text: 'US');
  final _promoCtrl = TextEditingController();
  String _paymentMethod = 'stripe';

  late final CartController _cartCtrl;
  late final PaymentController _paymentCtrl;
  late final PromotionController _promoController;
  late final ProfileController _profileCtrl;

  @override
  void initState() {
    super.initState();
    _cartCtrl = Get.find<CartController>();
    _paymentCtrl = Get.find<PaymentController>();
    _promoController = Get.find<PromotionController>();
    _promoController.clearPromo();
    _profileCtrl = Get.find<ProfileController>();
    _profileCtrl.loadAddresses().then((_) {
      if (!mounted) return;
      AddressModel? defaultAddress;
      for (final a in _profileCtrl.addresses) {
        if (a.isDefault) {
          defaultAddress = a;
          break;
        }
      }
      if (defaultAddress != null) _applyAddress(defaultAddress);
    });
  }

  void _applyAddress(AddressModel address) {
    setState(() {
      _streetCtrl.text = address.street;
      _cityCtrl.text = address.city;
      _stateCtrl.text = address.state;
      _zipCtrl.text = address.zip;
      _countryCtrl.text = address.country;
    });
  }

  void _pickSavedAddress() {
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: context.surfaceColor, borderRadius: const BorderRadius.vertical(top: Radius.circular(16))),
        child: Obx(() {
          if (_profileCtrl.addresses.isEmpty) {
            return Padding(
              padding: const EdgeInsets.all(24),
              child: Text('No saved addresses yet.', style: TextStyle(fontFamily: 'Inter', color: context.textSecondary)),
            );
          }
          // Material(transparency) gives each ListTile's ink splash a
          // surface to paint onto — the surrounding Container's own
          // BoxDecoration background would otherwise paint over it, since
          // it sits directly between the tiles and the bottom sheet's own
          // Material ancestor further up.
          return Material(
            type: MaterialType.transparency,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: _profileCtrl.addresses
                  .map((a) => ListTile(
                        leading: const Icon(Icons.location_on_outlined, color: AppColors.primary),
                        title: Text(a.label, style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w600, color: context.textPrimary)),
                        subtitle: Text(a.oneLine, style: TextStyle(fontFamily: 'Inter', fontSize: 12, color: context.textSecondary)),
                        onTap: () {
                          _applyAddress(a);
                          Get.back();
                        },
                      ))
                  .toList(),
            ),
          );
        }),
      ),
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
    );
  }

  @override
  void dispose() {
    _streetCtrl.dispose();
    _cityCtrl.dispose();
    _stateCtrl.dispose();
    _zipCtrl.dispose();
    _countryCtrl.dispose();
    _promoCtrl.dispose();
    super.dispose();
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) return;

    final address = {
      'street': _streetCtrl.text.trim(),
      'city': _cityCtrl.text.trim(),
      'state': _stateCtrl.text.trim(),
      'zip': _zipCtrl.text.trim(),
      'country': _countryCtrl.text.trim(),
    };

    final promoCode = _promoController.promoValidation.value != null
        ? _promoController.appliedCode.value
        : null;

    if (_paymentMethod == 'stripe') {
      Get.toNamed('/stripe-payment', arguments: {
        'address': address,
        'promoCode': promoCode,
      });
      return;
    }

    final order = await _cartCtrl.checkout(
      address: address,
      paymentMethod: _paymentMethod,
      promoCode: promoCode,
    );

    if (order != null) {
      Get.offNamed('/order-confirmation', arguments: order);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        iconTheme: const IconThemeData(color: AppColors.white),
        title: const Text(
          'Checkout',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
            fontSize: 20,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _OrderSummaryCard(
                  cartCtrl: _cartCtrl, promoCtrl: _promoController),
              const SizedBox(height: 20),
              _PromoCodeSection(
                promoCtrl: _promoController,
                promoTextCtrl: _promoCtrl,
                cartCtrl: _cartCtrl,
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _SectionHeader(title: 'Delivery Address'),
                  Obx(() => _profileCtrl.addresses.isEmpty
                      ? const SizedBox.shrink()
                      : TextButton.icon(
                          onPressed: _pickSavedAddress,
                          icon: const Icon(Icons.bookmark_outline_rounded, size: 16, color: AppColors.primary),
                          label: const Text('Saved Addresses', style: TextStyle(fontFamily: 'Inter', fontSize: 12, color: AppColors.primary)),
                          style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 0)),
                        )),
                ],
              ),
              const SizedBox(height: 12),
              _buildField(
                controller: _streetCtrl,
                label: 'Street Address',
                hint: '123 Main St',
                validator: _required,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildField(
                      controller: _cityCtrl,
                      label: 'City',
                      hint: 'New York',
                      validator: _required,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildField(
                      controller: _stateCtrl,
                      label: 'State',
                      hint: 'NY',
                      validator: _required,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildField(
                      controller: _zipCtrl,
                      label: 'ZIP Code',
                      hint: '10001',
                      keyboardType: TextInputType.number,
                      validator: _required,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildField(
                      controller: _countryCtrl,
                      label: 'Country',
                      hint: 'US',
                      validator: _required,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _SectionHeader(title: 'Payment Method'),
              const SizedBox(height: 12),
              _PaymentMethodSelector(
                selected: _paymentMethod,
                onChanged: (val) => setState(() => _paymentMethod = val),
              ),
              const SizedBox(height: 32),
              Obx(() => SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: (_cartCtrl.isSubmitting.value || _paymentCtrl.isProcessing.value) ? null : _placeOrder,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                        disabledBackgroundColor:
                            AppColors.primary.withValues(alpha: 0.6),
                      ),
                      child: (_cartCtrl.isSubmitting.value || _paymentCtrl.isProcessing.value)
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: AppColors.white,
                              ),
                            )
                          : const Text(
                              'Place Order',
                              style: TextStyle(
                                color: AppColors.white,
                                fontFamily: 'Inter',
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                              ),
                            ),
                    ),
                  )),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required String hint,
    TextInputType keyboardType = TextInputType.text,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      style: TextStyle(
        fontSize: 14,
        fontFamily: 'Inter',
        color: context.textPrimary,
      ),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        labelStyle: TextStyle(
          fontFamily: 'Inter',
          fontSize: 13,
          color: context.textSecondary,
        ),
        hintStyle: TextStyle(
          fontFamily: 'Inter',
          fontSize: 13,
          color: context.borderColor,
        ),
        filled: true,
        fillColor: context.surfaceColor,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: context.borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: context.borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.danger),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.danger, width: 1.5),
        ),
      ),
    );
  }

  String? _required(String? value) {
    if (value == null || value.trim().isEmpty) return 'This field is required';
    return null;
  }
}

class _OrderSummaryCard extends StatelessWidget {
  final CartController cartCtrl;
  final PromotionController promoCtrl;

  const _OrderSummaryCard({
    required this.cartCtrl,
    required this.promoCtrl,
  });

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final cart = cartCtrl.cart.value;
      if (cart == null) return const SizedBox.shrink();
      final promo = promoCtrl.promoValidation.value;

      return Container(
        decoration: BoxDecoration(
          color: context.surfaceColor,
          borderRadius: BorderRadius.circular(12),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0F000000),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Order Summary',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: context.textPrimary,
                fontFamily: 'Inter',
              ),
            ),
            const SizedBox(height: 10),
            ...cart.items.map(
              (item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${item.product.name} × ${item.quantity}',
                        style: TextStyle(
                          fontSize: 13,
                          color: context.textSecondary,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ),
                    Text(
                      '\$${item.subtotal.toStringAsFixed(2)}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: context.textPrimary,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Divider(color: context.borderColor, height: 20),
            Row(
              children: [
                Text(
                  'Subtotal',
                  style: TextStyle(
                    fontSize: 14,
                    color: context.textSecondary,
                    fontFamily: 'Inter',
                  ),
                ),
                const Spacer(),
                Text(
                  '\$${cart.total.toStringAsFixed(2)}',
                  style: TextStyle(
                    fontSize: 14,
                    color: context.textPrimary,
                    fontFamily: 'Inter',
                  ),
                ),
              ],
            ),
            if (promo != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  Text(
                    'Promo (${promo.promoCode})',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.success,
                      fontFamily: 'Inter',
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '-\$${promo.discount.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.success,
                      fontFamily: 'Inter',
                    ),
                  ),
                ],
              ),
            ],
            Divider(color: context.borderColor, height: 16),
            Row(
              children: [
                Text(
                  'Total',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: context.textPrimary,
                    fontFamily: 'Inter',
                  ),
                ),
                const Spacer(),
                Text(
                  promo != null
                      ? '\$${promo.finalTotal.toStringAsFixed(2)}'
                      : '\$${cart.total.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                    fontFamily: 'Inter',
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    });
  }
}

class _PromoCodeSection extends StatelessWidget {
  final PromotionController promoCtrl;
  final TextEditingController promoTextCtrl;
  final CartController cartCtrl;

  const _PromoCodeSection({
    required this.promoCtrl,
    required this.promoTextCtrl,
    required this.cartCtrl,
  });

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final promo = promoCtrl.promoValidation.value;
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.surfaceColor,
          borderRadius: BorderRadius.circular(12),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0F000000),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Promo Code',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: context.textPrimary,
                fontFamily: 'Inter',
              ),
            ),
            const SizedBox(height: 10),
            if (promo != null)
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                      color: AppColors.success.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.local_offer_outlined,
                        color: AppColors.success, size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        '${promo.promoCode} — \$${promo.discount.toStringAsFixed(2)} off',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.success,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        promoCtrl.clearPromo();
                        promoTextCtrl.clear();
                      },
                      child: Icon(Icons.close,
                          color: context.textSecondary, size: 18),
                    ),
                  ],
                ),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: promoTextCtrl,
                      textCapitalization: TextCapitalization.characters,
                      style: TextStyle(
                        fontSize: 14,
                        fontFamily: 'Inter',
                        color: context.textPrimary,
                        letterSpacing: 1.2,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Enter promo code',
                        hintStyle: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 13,
                          color: context.borderColor,
                          letterSpacing: 0,
                        ),
                        filled: true,
                        fillColor: context.pageBackground,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              BorderSide(color: context.borderColor),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              BorderSide(color: context.borderColor),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(
                              color: AppColors.primary, width: 1.5),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  ElevatedButton(
                    onPressed: promoCtrl.isValidating.value
                        ? null
                        : () {
                            final cart = cartCtrl.cart.value;
                            if (cart == null) return;
                            promoCtrl.validatePromo(
                              promoTextCtrl.text,
                              cart.total,
                            );
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 18, vertical: 13),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                      disabledBackgroundColor:
                          AppColors.primary.withValues(alpha: 0.6),
                    ),
                    child: promoCtrl.isValidating.value
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: AppColors.white),
                          )
                        : const Text(
                            'Apply',
                            style: TextStyle(
                              color: AppColors.white,
                              fontFamily: 'Inter',
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                  ),
                ],
              ),
          ],
        ),
      );
    });
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: context.textPrimary,
        fontFamily: 'Inter',
      ),
    );
  }
}

class _PaymentMethodSelector extends StatelessWidget {
  final String selected;
  final ValueChanged<String> onChanged;

  const _PaymentMethodSelector({
    required this.selected,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.surfaceColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          _PaymentOption(
            value: 'stripe',
            label: 'Credit / Debit Card',
            sublabel: 'Powered by Stripe — secure & encrypted',
            icon: Icons.credit_card_rounded,
            selected: selected,
            onChanged: onChanged,
          ),
          Divider(height: 1, color: context.borderColor, indent: 16, endIndent: 16),
          _PaymentOption(
            value: 'cod',
            label: 'Cash on Delivery',
            sublabel: 'Pay when your order arrives',
            icon: Icons.payments_outlined,
            selected: selected,
            onChanged: onChanged,
          ),
          Divider(height: 1, color: context.borderColor, indent: 16, endIndent: 16),
          _PaymentOption(
            value: 'bank_transfer',
            label: 'Bank Transfer',
            sublabel: 'Manual bank deposit',
            icon: Icons.account_balance_outlined,
            selected: selected,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}

class _PaymentOption extends StatelessWidget {
  final String value;
  final String label;
  final String sublabel;
  final IconData icon;
  final String selected;
  final ValueChanged<String> onChanged;

  const _PaymentOption({
    required this.value,
    required this.label,
    required this.sublabel,
    required this.icon,
    required this.selected,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isSelected = selected == value;
    return InkWell(
      onTap: () => onChanged(value),
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isSelected
                    ? context.primaryTintBackground
                    : context.pageBackground,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                color: isSelected
                    ? context.onPrimaryTintBackground
                    : context.textSecondary,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.w400,
                      color: isSelected
                          ? AppColors.primary
                          : context.textPrimary,
                      fontFamily: 'Inter',
                    ),
                  ),
                  Text(
                    sublabel,
                    style: TextStyle(
                      fontSize: 11,
                      color: context.textSecondary,
                      fontFamily: 'Inter',
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? AppColors.primary : context.borderColor,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? Center(
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primary,
                        ),
                      ),
                    )
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
