import 'package:get/get.dart';
import '../core/constants/api_constants.dart';
import '../services/api_service.dart';

class ContactController extends GetxController {
  final RxBool isSubmitting = false.obs;

  Future<bool> submitContactForm({
    required String name,
    required String email,
    required String subject,
    required String message,
  }) async {
    isSubmitting.value = true;
    try {
      await ApiService.post(ApiConstants.contact, {
        'name': name,
        'email': email,
        'subject': subject,
        'message': message,
      });
      Get.snackbar(
        'Message Sent',
        'We\'ve received your inquiry and will get back to you shortly.',
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 4),
      );
      return true;
    } on ApiException catch (e) {
      Get.snackbar('Error', e.message, snackPosition: SnackPosition.BOTTOM);
      return false;
    } catch (_) {
      Get.snackbar('Error', 'Failed to send message.', snackPosition: SnackPosition.BOTTOM);
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }
}
