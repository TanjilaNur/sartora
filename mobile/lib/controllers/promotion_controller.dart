import 'package:get/get.dart';
import '../core/constants/api_constants.dart';
import '../data/models/promotion_model.dart';
import '../services/api_service.dart';

class PromotionController extends GetxController {
  final Rxn<PromoValidation> promoValidation = Rxn<PromoValidation>();
  final RxBool isValidating = false.obs;
  final RxString appliedCode = ''.obs;

  Future<bool> validatePromo(String code, double orderTotal) async {
    if (code.trim().isEmpty) {
      Get.snackbar('Error', 'Please enter a promo code.',
          snackPosition: SnackPosition.BOTTOM);
      return false;
    }
    isValidating.value = true;
    try {
      final data = await ApiService.post(
        '${ApiConstants.promotions}/validate',
        {'code': code.trim().toUpperCase(), 'orderTotal': orderTotal},
        withAuth: true,
      );
      promoValidation.value = PromoValidation.fromJson(data);
      appliedCode.value = code.trim().toUpperCase();
      Get.snackbar(
        'Promo Applied',
        'Discount of \$${promoValidation.value!.discount.toStringAsFixed(2)} applied.',
        snackPosition: SnackPosition.BOTTOM,
      );
      return true;
    } on ApiException catch (e) {
      clearPromo();
      Get.snackbar('Invalid Code', e.message,
          snackPosition: SnackPosition.BOTTOM);
      return false;
    } catch (_) {
      clearPromo();
      Get.snackbar('Error', 'Failed to validate promo code.',
          snackPosition: SnackPosition.BOTTOM);
      return false;
    } finally {
      isValidating.value = false;
    }
  }

  void clearPromo() {
    promoValidation.value = null;
    appliedCode.value = '';
  }
}
