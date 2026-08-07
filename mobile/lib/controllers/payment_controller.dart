import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:get/get.dart';
import '../core/constants/api_constants.dart';
import '../data/models/transaction_model.dart';
import '../services/api_service.dart';

class PaymentController extends GetxController {
  final RxBool isProcessing = false.obs;
  final RxString errorMessage = ''.obs;
  final Rx<TransactionModel?> lastTransaction = Rx(null);

  // The order is actually created (with the real, promo-adjusted subtotal/
  // discount/total) when the payment intent is created — well before the
  // payment sheet even opens. Callers use this to fetch that real order
  // afterward instead of guessing at the charged amount.
  String? lastOrderId;

  /// Creates a Stripe payment intent on the backend and confirms it via flutter_stripe.
  /// Returns true on success, false on failure.
  Future<bool> pay({
    required Map<String, String> address,
    required String currency,
    String? promoCode,
  }) async {
    isProcessing.value = true;
    errorMessage.value = '';
    try {
      final data = await ApiService.post(
        ApiConstants.paymentIntent,
        {
          'address': address,
          'currency': currency,
          if (promoCode != null && promoCode.isNotEmpty) 'promoCode': promoCode,
        },
        withAuth: true,
      );

      lastOrderId = data['orderId'] as String?;

      final clientSecret = data['clientSecret'] as String?;
      if (clientSecret == null) {
        errorMessage.value = 'Invalid response from payment server.';
        return false;
      }

      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: 'Sartora',
          style: ThemeMode.system,
        ),
      );

      await Stripe.instance.presentPaymentSheet();
      return true;
    } on StripeException catch (e) {
      if (e.error.code == FailureCode.Canceled) {
        errorMessage.value = 'Payment cancelled.';
      } else {
        errorMessage.value = e.error.localizedMessage ?? 'Payment failed.';
      }
      return false;
    } on ApiException catch (e) {
      errorMessage.value = e.message;
      return false;
    } catch (_) {
      errorMessage.value = 'An unexpected error occurred.';
      return false;
    } finally {
      isProcessing.value = false;
    }
  }

  Future<void> fetchTransaction(String orderId) async {
    try {
      final data = await ApiService.get(
        '${ApiConstants.paymentTransaction}/$orderId',
        withAuth: true,
      );
      final txJson = data['transaction'] as Map<String, dynamic>?;
      if (txJson != null) {
        lastTransaction.value = TransactionModel.fromJson(txJson);
      }
    } catch (_) {}
  }
}
