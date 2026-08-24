import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:get/get.dart';
import 'controllers/auth_controller.dart';
import 'controllers/cart_controller.dart';
import 'controllers/category_controller.dart';
import 'controllers/guest_controller.dart';
import 'controllers/order_controller.dart';
import 'controllers/payment_controller.dart';
import 'controllers/product_controller.dart';
import 'controllers/promotion_controller.dart';
import 'controllers/points_controller.dart';
import 'controllers/faq_controller.dart';
import 'controllers/contact_controller.dart';
import 'controllers/theme_controller.dart';
import 'controllers/profile_controller.dart';
import 'controllers/biometric_controller.dart';
import 'services/push_service.dart';
import 'core/theme/app_theme.dart';
import 'presentation/screens/cart_screen.dart';
import 'presentation/screens/checkout_screen.dart';
import 'presentation/screens/login_screen.dart';
import 'presentation/screens/order_confirmation_screen.dart';
import 'presentation/screens/order_detail_screen.dart';
import 'presentation/screens/orders_screen.dart';
import 'presentation/screens/payment_success_screen.dart';
import 'presentation/screens/signup_screen.dart';
import 'presentation/screens/home_screen.dart';
import 'presentation/screens/product_detail_screen.dart';
import 'presentation/screens/product_reviews_screen.dart';
import 'presentation/screens/guest_cart_screen.dart';
import 'presentation/screens/guest_home_screen.dart';
import 'presentation/screens/phone_login_screen.dart';
import 'presentation/screens/stripe_payment_screen.dart';
import 'presentation/screens/rewards_screen.dart';
import 'presentation/screens/points_screen.dart';
import 'presentation/screens/badges_screen.dart';
import 'presentation/screens/leaderboard_screen.dart';
import 'presentation/screens/help_screen.dart';
import 'presentation/screens/faq_screen.dart';
import 'presentation/screens/contact_screen.dart';
import 'presentation/screens/settings_screen.dart';
import 'presentation/screens/profile_edit_screen.dart';
import 'presentation/screens/address_book_screen.dart';
import 'presentation/screens/address_form_screen.dart';
import 'presentation/screens/wishlist_screen.dart';
import 'presentation/screens/forgot_password_screen.dart';
import 'presentation/screens/lock_screen.dart';
import 'data/models/address_model.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Stripe publishable key — set STRIPE_PUBLISHABLE_KEY to your real key.
  // The placeholder below allows the app to boot; replace before going live.
  Stripe.publishableKey =
      const String.fromEnvironment('STRIPE_PUBLISHABLE_KEY',
          defaultValue: 'pk_test_replace_with_your_stripe_publishable_key');
  runApp(const DressShopApp());
}

class DressShopApp extends StatefulWidget {
  const DressShopApp({super.key});

  @override
  State<DressShopApp> createState() => _DressShopAppState();
}

class _DressShopAppState extends State<DressShopApp> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Re-locking only at cold launch would protect almost nothing in
    // practice — the actual value of an app lock is re-engaging it whenever
    // the app comes back from the background, not just on first open.
    if (state == AppLifecycleState.paused) {
      Get.find<BiometricController>().relock();
    } else if (state == AppLifecycleState.resumed) {
      final biometric = Get.find<BiometricController>();
      if (biometric.isLocked.value && Get.currentRoute != '/lock' && Get.currentRoute != '/login') {
        Get.toNamed('/lock');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: 'Sartora',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      initialBinding: BindingsBuilder(() {
        Get.put(ThemeController(), permanent: true);
        Get.put(BiometricController(), permanent: true);
        Get.put(PushService(), permanent: true);
        Get.put(GuestController());
        Get.put(AuthController());
        Get.put(CategoryController());
        Get.put(ProductController());
        Get.put(CartController());
        Get.put(PaymentController());
        Get.put(OrderController());
        // ReviewController is intentionally NOT registered here — it's scoped
        // per-product (tagged by productId) and owned by ProductDetailScreen,
        // since a single shared instance let one product's in-flight
        // load/loading state bleed into whichever other product screen was
        // on screen when it resolved.
        Get.put(PromotionController());
        Get.put(PointsController());
        Get.put(FaqController());
        Get.put(ContactController());
        Get.put(ProfileController());
      }),
      initialRoute: '/login',
      getPages: [
        GetPage(name: '/login', page: () => const LoginScreen()),
        GetPage(name: '/phone-login', page: () => const PhoneLoginScreen()),
        GetPage(name: '/signup', page: () => const SignupScreen()),
        GetPage(name: '/home', page: () => const HomeScreen()),
        GetPage(
          name: '/product/:id',
          page: () {
            final id = Get.parameters['id'] ?? '';
            return ProductDetailScreen(productId: id);
          },
        ),
        GetPage(name: '/cart', page: () => const CartScreen()),
        GetPage(name: '/checkout', page: () => const CheckoutScreen()),
        GetPage(
          name: '/order-confirmation',
          page: () => const OrderConfirmationScreen(),
        ),
        GetPage(
          name: '/stripe-payment',
          page: () => const StripePaymentScreen(),
        ),
        GetPage(
          name: '/payment-success',
          page: () => const PaymentSuccessScreen(),
        ),
        GetPage(name: '/rewards', page: () => const RewardsScreen()),
        GetPage(name: '/points', page: () => const PointsScreen()),
        GetPage(name: '/badges', page: () => const BadgesScreen()),
        GetPage(name: '/leaderboard', page: () => const LeaderboardScreen()),
        GetPage(name: '/guest-home', page: () => const GuestHomeScreen()),
        GetPage(name: '/guest-cart', page: () => const GuestCartScreen()),
        GetPage(name: '/orders', page: () => const OrdersScreen()),
        GetPage(name: '/order-detail', page: () => const OrderDetailScreen()),
        GetPage(
          name: '/product-reviews',
          page: () {
            final args = Get.arguments as Map<String, dynamic>? ?? {};
            return ProductReviewsScreen(
              productId: args['productId'] as String? ?? '',
              productName: args['productName'] as String? ?? 'Product',
            );
          },
        ),
        GetPage(name: '/help', page: () => const HelpScreen()),
        GetPage(name: '/faq', page: () => const FaqScreen()),
        GetPage(name: '/contact', page: () => const ContactScreen()),
        GetPage(name: '/settings', page: () => const SettingsScreen()),
        GetPage(name: '/profile-edit', page: () => const ProfileEditScreen()),
        GetPage(name: '/addresses', page: () => const AddressBookScreen()),
        GetPage(
          name: '/address-form',
          page: () => AddressFormScreen(existing: Get.arguments as AddressModel?),
        ),
        GetPage(name: '/wishlist', page: () => const WishlistScreen()),
        GetPage(name: '/forgot-password', page: () => const ForgotPasswordScreen()),
        GetPage(name: '/lock', page: () => const LockScreen()),
      ],
    );
  }
}
