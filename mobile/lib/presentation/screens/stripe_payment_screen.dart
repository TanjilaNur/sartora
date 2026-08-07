import 'dart:async';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/cart_controller.dart';
import '../../controllers/order_controller.dart';
import '../../controllers/payment_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';

class StripePaymentScreen extends StatefulWidget {
  const StripePaymentScreen({super.key});

  @override
  State<StripePaymentScreen> createState() => _StripePaymentScreenState();
}

class _StripePaymentScreenState extends State<StripePaymentScreen> {
  late final PaymentController _paymentCtrl;
  late final CartController _cartCtrl;
  late final Map<String, String> _address;
  String? _promoCode;
  bool _launched = false;

  @override
  void initState() {
    super.initState();
    _paymentCtrl = Get.find<PaymentController>();
    _cartCtrl = Get.find<CartController>();
    final args = Get.arguments;
    if (args is Map<String, String>) {
      // Backwards-compatible: older call sites may still pass just the address.
      _address = args;
      _promoCode = null;
    } else if (args is Map) {
      _address = (args['address'] as Map<String, String>?) ?? {};
      _promoCode = args['promoCode'] as String?;
    } else {
      _address = {};
      _promoCode = null;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) => _startPayment());
  }

  Future<void> _startPayment() async {
    if (_launched) return;
    _launched = true;

    final success = await _paymentCtrl.pay(
      address: _address,
      currency: 'usd',
      promoCode: _promoCode,
    );

    if (!mounted) return;

    if (success) {
      unawaited(_cartCtrl.fetchCart());
      // The order (with the real, promo-adjusted subtotal/discount/total)
      // was already created when the payment intent was created — fetch
      // that instead of guessing at what was charged.
      final orderId = _paymentCtrl.lastOrderId;
      final realOrder =
          orderId != null ? await Get.find<OrderController>().fetchOrderById(orderId) : null;
      if (!mounted) return;
      if (realOrder != null) {
        Get.offNamed('/payment-success', arguments: realOrder);
      } else {
        Get.offAllNamed('/orders');
        Get.snackbar(
          'Payment Successful',
          'Your order was placed — view it in Orders.',
          snackPosition: SnackPosition.BOTTOM,
        );
      }
    } else {
      Get.back();
      final msg = _paymentCtrl.errorMessage.value;
      if (msg.isNotEmpty && msg != 'Payment cancelled.') {
        Get.snackbar(
          'Payment Failed',
          msg,
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: AppColors.danger,
          colorText: AppColors.white,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        iconTheme: const IconThemeData(color: AppColors.white),
        title: const Text(
          'Secure Payment',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
            fontSize: 20,
          ),
        ),
      ),
      body: Obx(() => Center(
            child: _paymentCtrl.isProcessing.value
                ? Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const CircularProgressIndicator(color: AppColors.primary),
                      const SizedBox(height: 16),
                      Text(
                        'Preparing secure payment…',
                        style: TextStyle(
                          fontSize: 14,
                          color: context.textSecondary,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ],
                  )
                : const SizedBox.shrink(),
          )),
    );
  }
}
