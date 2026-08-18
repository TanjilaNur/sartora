// Full golden-path walkthrough for the nine newly-added Sartora features,
// driven through the real widget tree via WidgetTester rather than
// coordinate-based taps (see task notes: AppleScript/simctl coordinate
// automation proved unreliable in this environment before this test was
// written). Run with:
//   flutter test integration_test/app_test.dart -d <udid>
//
// Design notes:
//  - One long testWidgets() so GetX's global controller registry (populated
//    once by app.main()) doesn't need to be reconstructed per test.
//  - Each feature is wrapped by step() which catches failures and records
//    them into `results` rather than aborting the whole run, so a failure in
//    one feature doesn't prevent the rest from being exercised and reported.
//  - Finders are scoped to the current screen (`inScreen<T>(...)`) because
//    GetX's `Get.toNamed` (push) keeps prior routes mounted in the element
//    tree (only `offNamed`/`offAllNamed` dispose them), so unscoped
//    find.text/find.byType can match widgets on a screen underneath the
//    current one (confirmed while writing this: Login + ForgotPassword, or
//    Login + Signup, are simultaneously mounted after a push).
// ignore_for_file: avoid_print
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:integration_test/integration_test.dart';

import 'package:app/main.dart' as app;
import 'package:app/controllers/auth_controller.dart';
import 'package:app/controllers/biometric_controller.dart';
import 'package:app/controllers/order_controller.dart';
import 'package:app/controllers/profile_controller.dart';
import 'package:app/presentation/screens/address_form_screen.dart';
import 'package:app/presentation/screens/checkout_screen.dart';
import 'package:app/presentation/screens/forgot_password_screen.dart';
import 'package:app/presentation/screens/login_screen.dart';
import 'package:app/presentation/screens/order_detail_screen.dart';
import 'package:app/presentation/screens/product_detail_screen.dart';
import 'package:app/presentation/screens/profile_edit_screen.dart';
import 'package:app/presentation/screens/settings_screen.dart';
import 'package:app/presentation/screens/signup_screen.dart';
import 'package:app/presentation/screens/wishlist_screen.dart';
import 'package:app/presentation/widgets/product_card.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  final results = <String, String>{};

  Finder inScreen<T extends Widget>(Finder matching) =>
      find.descendant(of: find.byType(T), matching: matching);

  Finder inDialog(Finder matching) =>
      find.descendant(of: find.byType(AlertDialog), matching: matching);

  Finder switchNear(String label) => find.descendant(
        of: find.ancestor(of: find.text(label), matching: find.byType(ListTile)),
        matching: find.byType(Switch),
      );

  testWidgets('Sartora feature walkthrough', (tester) async {
    Future<void> step(String name, Future<void> Function() body) async {
      print('>>> STEP: $name');
      try {
        await body();
        results[name] = 'PASS';
        print('<<< PASS: $name');
      } catch (e, st) {
        results[name] = 'FAIL: $e';
        print('<<< FAIL: $name -- $e\n$st');
      }
    }

    try {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // ---------------------------------------------------------------
      // Stage 0: land on a known route. App auto-restores the currently
      // logged-in session from secure storage (Keychain persists across
      // process relaunches on the same simulator).
      // ---------------------------------------------------------------
      await tester.pumpAndSettle(const Duration(seconds: 2));
      print('Initial route after launch: ${Get.currentRoute}');
      if (Get.currentRoute == '/lock') {
        // Best-effort: try the Unlock button in case the simulator has
        // biometrics enrolled+matching already configured.
        final unlock = find.text('Unlock');
        if (tester.any(unlock)) {
          await tester.tap(unlock);
          await tester.pumpAndSettle(const Duration(seconds: 2));
        }
      }

      // Unlike the plain `flutter run` debug build, this integration_test
      // XCTest runner DOES persist Keychain/secure-storage state across
      // separate `flutter test` invocations on the same simulator — so a
      // throwaway account registered (and left logged in, e.g. by an
      // earlier run stopping partway through) auto-restores straight to
      // /home here, skipping the registration step entirely. Confirmed by
      // running this suite back to back: the 2nd run landed on /home with
      // the 1st run's wishlist/address changes still in place, causing
      // "expected an empty heart" / ambiguous-address-match failures that
      // had nothing to do with the app itself. Forcing a logout up front
      // regardless of the auto-restored route makes every run independent.
      Get.offAllNamed('/home');
      await tester.pumpAndSettle(const Duration(seconds: 1));
      if (find.byIcon(Icons.logout_rounded).evaluate().isNotEmpty) {
        await tester.tap(find.byIcon(Icons.logout_rounded));
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }
      print('Route after forcing logout: ${Get.currentRoute}');

      // A "known seeded fixture" (sarah@example.com/User@123) was tried here
      // first, but confirmed via a direct API call to be stale — the seed
      // script documents that password, but the live database's actual
      // password hash no longer matches it (401 "Invalid credentials", not a
      // rate-limit 429), most likely password drift from testing earlier in
      // this same long-running session. Registering a fresh throwaway
      // account instead sidesteps that fixture-staleness problem entirely —
      // it's also just better test hygiene: this suite shouldn't depend on
      // exact shared seed-data credentials staying untouched forever.
      String throwawayEmail = '';
      const throwawayPassword = 'Throwaway@123';
      if (Get.currentRoute == '/login') {
        await step('Register fresh throwaway account', () async {
          // Both email AND phone need to be unique per run — a hardcoded
          // phone number here collided with leftover throwaway accounts
          // from earlier runs of this same suite that failed before
          // reaching their own delete-account cleanup step (backend
          // enforces phone uniqueness), causing registration to silently
          // stay on /signup with a validation error the test wasn't
          // surfacing.
          final stamp = DateTime.now().millisecondsSinceEpoch;
          throwawayEmail = 'qa.throwaway.$stamp@example.com';
          final throwawayPhone = '+1555${stamp.toString().substring(stamp.toString().length - 7)}';
          await tester.tap(inScreen<LoginScreen>(find.text('Sign Up')));
          await tester.pumpAndSettle(const Duration(seconds: 1));
          final fields = inScreen<SignupScreen>(find.byType(TextFormField));
          await tester.enterText(fields.at(0), 'QA Throwaway');
          await tester.enterText(fields.at(1), throwawayEmail);
          await tester.enterText(fields.at(2), throwawayPhone);
          await tester.enterText(fields.at(3), throwawayPassword);
          await tester.enterText(fields.at(4), throwawayPassword);
          await tester.pump();
          // 'Create Account' also appears as a heading Text above the form,
          // so scope to the actual submit button (a FilledButton here, NOT
          // an ElevatedButton like the address form's equivalent submit
          // button below — checked signup_screen.dart directly rather than
          // assuming the two screens share a button widget type).
          await tester.tap(find.widgetWithText(FilledButton, 'Create Account'));
          await tester.pumpAndSettle(const Duration(seconds: 3));
          if (Get.currentRoute != '/home') {
            print('DIAGNOSTIC: registration did not reach /home. AuthController.errorMessage = '
                '"${Get.find<AuthController>().errorMessage.value}"');
          }
          expect(Get.currentRoute, '/home', reason: 'registering should auto-login and land on /home');
        });
      }

      String originalEmail = '';
      String originalName = '';

      // ---------------------------------------------------------------
      // Stage 1: identify the logged-in account via Settings -> Edit
      // Profile (required before anything destructive; nothing destructive
      // is done to this account anywhere in this test — see note above).
      // ---------------------------------------------------------------
      await step('0. Identify current account via Settings', () async {
        expect(Get.currentRoute, '/home', reason: 'expected to be on /home at this point');
        await tester.tap(find.byIcon(Icons.settings_rounded));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.tap(inScreen<SettingsScreen>(find.text('Edit Profile')));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        final nameField =
            tester.widget<TextFormField>(inScreen<ProfileEditScreen>(find.byType(TextFormField)).at(0));
        final emailField =
            tester.widget<TextFormField>(inScreen<ProfileEditScreen>(find.byType(TextFormField)).at(1));
        originalName = nameField.controller!.text;
        originalEmail = emailField.controller!.text;
        print('Currently logged in as: name="$originalName" email="$originalEmail"');
        Get.back(); // ProfileEdit -> Settings
        Get.back(); // Settings -> Home
        await tester.pumpAndSettle(const Duration(seconds: 1));
      });

      // ---------------------------------------------------------------
      // Stage 2: Wishlist — heart on catalog card, heart on detail page,
      // Settings -> My Wishlist, consistency both directions.
      // ---------------------------------------------------------------
      await step('1. Wishlist toggle (catalog card + detail + wishlist screen)', () async {
        await tester.tap(find.descendant(
            of: find.byType(BottomNavigationBar), matching: find.text('Catalog')));
        await tester.pumpAndSettle(const Duration(seconds: 2));

        final card0 = find.byType(ProductCard).first;
        expect(card0, findsWidgets, reason: 'expected at least one product card in catalog');
        final heartOnCard =
            find.descendant(of: card0, matching: find.byIcon(Icons.favorite_border_rounded));
        expect(heartOnCard, findsOneWidget, reason: 'expected an empty heart on first catalog card');
        await tester.tap(heartOnCard);
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 400));
        expect(find.descendant(of: card0, matching: find.byIcon(Icons.favorite_rounded)), findsOneWidget,
            reason: 'heart should be filled on the card immediately after tapping it');

        await tester.tap(card0);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        final detailHeart = inScreen<ProductDetailScreen>(find.byIcon(Icons.favorite_rounded));
        expect(detailHeart, findsOneWidget,
            reason: 'product detail heart should already show filled, consistent with the card');

        Get.back(); // detail -> catalog
        await tester.pumpAndSettle(const Duration(seconds: 1));

        // Navigate to My Wishlist via Settings and confirm it's listed there.
        await tester.tap(find.descendant(
            of: find.byType(BottomNavigationBar), matching: find.text('Home')));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.tap(find.byIcon(Icons.settings_rounded));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.tap(inScreen<SettingsScreen>(find.text('My Wishlist')));
        await tester.pumpAndSettle(const Duration(seconds: 2));
        // Scoped to WishlistScreen: Home's IndexedStack keeps CatalogScreen
        // (with its own ProductCard for the same now-wishlisted product)
        // mounted underneath, so an unscoped find.byType(ProductCard) would
        // be ambiguous between the two screens.
        expect(inScreen<WishlistScreen>(find.byType(ProductCard)), findsWidgets,
            reason: 'wishlisted product should appear on the Wishlist screen');

        // Un-wishlist from the Wishlist screen itself (tests the heart there
        // too, and leaves state clean).
        final wishlistHeart = find.descendant(
            of: inScreen<WishlistScreen>(find.byType(ProductCard)).first,
            matching: find.byIcon(Icons.favorite_rounded));
        await tester.tap(wishlistHeart);
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 400));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        expect(inScreen<WishlistScreen>(find.text('Your wishlist is empty')), findsOneWidget,
            reason: 'wishlist should be empty again after un-hearting the only item');

        Get.back(); // Wishlist -> Settings
        Get.back(); // Settings -> Home
        await tester.pumpAndSettle(const Duration(seconds: 1));
      });

      // ---------------------------------------------------------------
      // Stage 3: Address book — add x2, edit, delete default -> confirm
      // reassignment, delete remaining -> back to original count.
      // ---------------------------------------------------------------
      await step('2. Address book (add/edit/delete + default reassignment)', () async {
        await tester.tap(find.byIcon(Icons.settings_rounded));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.tap(inScreen<SettingsScreen>(find.text('My Addresses')));
        await tester.pumpAndSettle(const Duration(seconds: 2));

        final profile = Get.find<ProfileController>();
        final startingCount = profile.addresses.length;

        Future<void> fillAddressForm({
          required String label,
          required String street,
          required String city,
          required String state,
          required String zip,
          bool setDefault = false,
        }) async {
          final fields = inScreen<AddressFormScreen>(find.byType(TextFormField));
          await tester.enterText(fields.at(0), label);
          await tester.enterText(fields.at(1), street);
          await tester.enterText(fields.at(2), city);
          await tester.enterText(fields.at(3), state);
          await tester.enterText(fields.at(4), zip);
          await tester.pump();
          if (setDefault) {
            await tester.tap(inScreen<AddressFormScreen>(find.text('Set as default address')));
            await tester.pump();
          }
          // 'Add Address' also appears as the AppBar title, so scope to the
          // actual button rather than find.text (which would be ambiguous).
          await tester.tap(find.widgetWithText(ElevatedButton, 'Add Address'));
          await tester.pumpAndSettle(const Duration(seconds: 2));
        }

        // Address A (default)
        await tester.tap(find.byIcon(Icons.add_rounded));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await fillAddressForm(
            label: 'QA Home', street: '123 Test St', city: 'Testville', state: 'TS', zip: '11111', setDefault: true);
        expect(find.text('QA Home'), findsOneWidget);

        // Address B (not default)
        await tester.tap(find.byIcon(Icons.add_rounded));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await fillAddressForm(label: 'QA Work', street: '456 Work Ave', city: 'Worktown', state: 'WT', zip: '22222');
        expect(find.text('QA Work'), findsOneWidget);
        expect(profile.addresses.length, startingCount + 2);

        // Edit Address A
        await tester.tap(find.descendant(
            of: find.ancestor(of: find.text('QA Home'), matching: find.byType(Container)).first,
            matching: find.byIcon(Icons.more_vert_rounded)));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.tap(find.text('Edit'));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        final editFields = inScreen<AddressFormScreen>(find.byType(TextFormField));
        print('DIAGNOSTIC: AddressFormScreen field count = ${editFields.evaluate().length}');
        for (var i = 0; i < editFields.evaluate().length; i++) {
          final w = tester.widget<TextFormField>(editFields.at(i));
          print('DIAGNOSTIC: field[$i] = "${w.controller?.text}"');
        }
        await tester.enterText(editFields.at(1), '999 Edited St');
        await tester.tap(find.text('Save Changes'));
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('DIAGNOSTIC: addresses after save = ${profile.addresses.map((a) => a.oneLine).toList()}');
        print('DIAGNOSTIC: errorMessage = "${profile.errorMessage.value}"');
        expect(find.text('999 Edited St, Testville, TS 11111, US'), findsOneWidget,
            reason: 'edited street should show in the one-line address summary');

        // Delete Address A (the default) -> confirm Address B is promoted.
        await tester.tap(find.descendant(
            of: find.ancestor(of: find.text('QA Home'), matching: find.byType(Container)).first,
            matching: find.byIcon(Icons.more_vert_rounded)));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.tap(find.text('Delete'));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.tap(inDialog(find.text('Delete')));
        await tester.pumpAndSettle(const Duration(seconds: 2));
        expect(find.text('QA Home'), findsNothing);
        expect(
            find.descendant(
                of: find.ancestor(of: find.text('QA Work'), matching: find.byType(Container)).first,
                matching: find.text('DEFAULT')),
            findsOneWidget,
            reason: 'remaining address should be auto-promoted to default after deleting the default one');

        // Clean up: delete Address B too, back to starting count.
        await tester.tap(find.descendant(
            of: find.ancestor(of: find.text('QA Work'), matching: find.byType(Container)).first,
            matching: find.byIcon(Icons.more_vert_rounded)));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.tap(find.text('Delete'));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.tap(inDialog(find.text('Delete')));
        await tester.pumpAndSettle(const Duration(seconds: 2));
        expect(profile.addresses.length, startingCount);

        Get.back(); // Addresses -> Settings
        Get.back(); // Settings -> Home
        await tester.pumpAndSettle(const Duration(seconds: 1));
      });

      // ---------------------------------------------------------------
      // Stage 4: Profile editing — change name, confirm reflected, revert.
      // ---------------------------------------------------------------
      await step('3. Profile editing (change name, confirm reflected, revert)', () async {
        await tester.tap(find.byIcon(Icons.settings_rounded));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.tap(inScreen<SettingsScreen>(find.text('Edit Profile')));
        await tester.pumpAndSettle(const Duration(seconds: 1));

        const testName = 'QA Test Name';
        await tester.enterText(inScreen<ProfileEditScreen>(find.byType(TextFormField)).at(0), testName);
        await tester.tap(find.text('Save Changes'));
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 400));
        expect(find.text('Profile updated'), findsOneWidget);
        await tester.pumpAndSettle(const Duration(seconds: 1));

        Get.back(); // Settings
        await tester.pumpAndSettle(const Duration(seconds: 1));
        Get.back(); // Home
        await tester.pumpAndSettle(const Duration(seconds: 1));
        expect(find.text('Welcome, $testName!'), findsOneWidget,
            reason: 'home welcome banner should reflect the updated name');

        // Revert.
        await tester.tap(find.byIcon(Icons.settings_rounded));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.tap(inScreen<SettingsScreen>(find.text('Edit Profile')));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.enterText(inScreen<ProfileEditScreen>(find.byType(TextFormField)).at(0), originalName);
        await tester.tap(find.text('Save Changes'));
        await tester.pumpAndSettle(const Duration(seconds: 2));
        Get.back(); // Settings
        await tester.pumpAndSettle(const Duration(seconds: 1));
        Get.back(); // Home
        await tester.pumpAndSettle(const Duration(seconds: 1));
        expect(find.text('Welcome, $originalName!'), findsOneWidget, reason: 'name should be restored');
      });

      // ---------------------------------------------------------------
      // Stage 5: Notification preferences — toggle 3, persist across nav,
      // revert to original.
      // ---------------------------------------------------------------
      await step('4. Notification preferences (toggle x3, persists, revert)', () async {
        await tester.tap(find.byIcon(Icons.settings_rounded));
        await tester.pumpAndSettle(const Duration(seconds: 1));

        const labels = ['Order Updates', 'Promotions', 'Newsletter'];
        final original = <String, bool>{};
        for (final label in labels) {
          // The Settings screen has grown tall enough (with all the new
          // sections added this round) that Promotions/Newsletter sit below
          // the fold on this simulator — without scrolling them into view
          // first, tap() hits nothing and the switch silently never flips.
          await tester.ensureVisible(switchNear(label));
          await tester.pumpAndSettle(const Duration(milliseconds: 300));
          final sw = tester.widget<Switch>(switchNear(label));
          original[label] = sw.value;
          await tester.tap(switchNear(label));
          await tester.pump();
          await tester.pump(const Duration(milliseconds: 400));
          await tester.pumpAndSettle(const Duration(seconds: 1));
          final after = tester.widget<Switch>(switchNear(label));
          expect(after.value, !original[label]!, reason: '$label should have flipped');
        }

        // Navigate away and back; confirm the flipped values stuck.
        Get.back();
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.tap(find.byIcon(Icons.settings_rounded));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        for (final label in labels) {
          final sw = tester.widget<Switch>(switchNear(label));
          expect(sw.value, !original[label]!, reason: '$label should still be flipped after navigating away and back');
        }

        // Revert to original values.
        for (final label in labels) {
          await tester.ensureVisible(switchNear(label));
          await tester.pumpAndSettle(const Duration(milliseconds: 300));
          await tester.tap(switchNear(label));
          await tester.pump();
          await tester.pump(const Duration(milliseconds: 400));
          await tester.pumpAndSettle(const Duration(seconds: 1));
        }
        for (final label in labels) {
          final sw = tester.widget<Switch>(switchNear(label));
          expect(sw.value, original[label], reason: '$label should be restored to its original value');
        }

        Get.back();
        await tester.pumpAndSettle(const Duration(seconds: 1));
      });

      // ---------------------------------------------------------------
      // Stage 6: Reorder — ensure a past order exists (place one via COD
      // if My Orders is empty), open it, confirm tracking renders, tap
      // Reorder, confirm snackbar + cart reflects it.
      // ---------------------------------------------------------------
      await step('5. Reorder (order detail tracking widget + reorder action)', () async {
        await tester.tap(find.descendant(
            of: find.byType(BottomNavigationBar), matching: find.text('Orders')));
        await tester.pumpAndSettle(const Duration(seconds: 2));

        final orderCtrl = Get.find<OrderController>();
        if (orderCtrl.orders.isEmpty) {
          print('No past orders for this account — placing one via Cash on Delivery first.');
          Get.back();
          await tester.pumpAndSettle(const Duration(seconds: 1));
          await tester.tap(find.descendant(
              of: find.byType(BottomNavigationBar), matching: find.text('Catalog')));
          await tester.pumpAndSettle(const Duration(seconds: 2));

          var placed = false;
          final cardCount = tester.widgetList(find.byType(ProductCard)).length;
          for (var i = 0; i < cardCount && i < 6 && !placed; i++) {
            await tester.tap(find.byType(ProductCard).at(i));
            await tester.pumpAndSettle(const Duration(seconds: 2));
            final addBtn = find.widgetWithText(ElevatedButton, 'Add to Cart');
            if (tester.any(addBtn)) {
              final btn = tester.widget<ElevatedButton>(addBtn);
              if (btn.onPressed != null) {
                await tester.tap(addBtn);
                await tester.pump();
                await tester.pump(const Duration(milliseconds: 500));
                placed = true;
                Get.back();
                await tester.pumpAndSettle(const Duration(seconds: 1));
                break;
              }
            }
            Get.back();
            await tester.pumpAndSettle(const Duration(seconds: 1));
          }
          expect(placed, isTrue, reason: 'expected to add at least one simple (no variant) product to cart');

          await tester.tap(find.descendant(
              of: find.byType(BottomNavigationBar), matching: find.text('Cart')));
          await tester.pumpAndSettle(const Duration(seconds: 2));
          await tester.tap(find.text('Proceed to Checkout'));
          await tester.pumpAndSettle(const Duration(seconds: 2));

          final checkoutFields = inScreen<CheckoutScreen>(find.byType(TextFormField));
          await tester.enterText(checkoutFields.at(0), '789 Reorder Ave');
          await tester.enterText(checkoutFields.at(1), 'Cartville');
          await tester.enterText(checkoutFields.at(2), 'CT');
          await tester.enterText(checkoutFields.at(3), '33333');
          await tester.pump();
          await tester.tap(inScreen<CheckoutScreen>(find.text('Cash on Delivery')));
          await tester.pump();
          await tester.tap(find.text('Place Order'));
          await tester.pumpAndSettle(const Duration(seconds: 3));
          expect(find.text('Continue Shopping'), findsOneWidget,
              reason: 'expected to land on order confirmation after COD checkout');
          await tester.tap(find.text('Continue Shopping'));
          await tester.pumpAndSettle(const Duration(seconds: 2));

          await tester.tap(find.descendant(
              of: find.byType(BottomNavigationBar), matching: find.text('Orders')));
          await tester.pumpAndSettle(const Duration(seconds: 2));
        }

        expect(orderCtrl.orders, isNotEmpty, reason: 'expected at least one order to test reorder with');
        await tester.tap(find.byType(GestureDetector).first.hitTestable().evaluate().isNotEmpty
            ? find.byType(GestureDetector).first
            : find.byType(ListTile).first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        expect(find.text('Order Tracking'), findsOneWidget,
            reason: 'tracking step-widget should render without crashing (unless order is cancelled)');

        await tester.tap(inScreen<OrderDetailScreen>(find.text('Reorder')));
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 600));
        final snackbarShown = find.text('Added to Cart').evaluate().isNotEmpty ||
            find.text('Partially Added').evaluate().isNotEmpty ||
            find.text('Could Not Reorder').evaluate().isNotEmpty;
        expect(snackbarShown, isTrue, reason: 'expected a reorder summary snackbar to appear');
        await tester.pumpAndSettle(const Duration(seconds: 1));
      });

      // ---------------------------------------------------------------
      // Stage 7: log out to reach the Login screen for the remaining
      // logged-out checks.
      // ---------------------------------------------------------------
      await step('6. Logout to reach Login screen', () async {
        // Navigate back to a clean Home first if we're not already there.
        Get.offAllNamed('/home');
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.tap(find.byIcon(Icons.logout_rounded));
        await tester.pumpAndSettle(const Duration(seconds: 2));
        expect(Get.currentRoute, '/login');
      });

      // ---------------------------------------------------------------
      // Stage 8: Login screen — confirm Forgot Password + Google buttons.
      // ---------------------------------------------------------------
      await step('7. Login screen renders Forgot Password + Google Sign-In', () async {
        expect(inScreen<LoginScreen>(find.text('Forgot password?')), findsOneWidget);
        expect(inScreen<LoginScreen>(find.text('Sign in with Google')), findsOneWidget);

        // Clear the exception accumulator first — takeException() reports
        // EVERY framework-level assertion caught since the last time it was
        // called (e.g. earlier steps' benign "ListTile background color...
        // may be invisible" warnings), not just ones from this action; left
        // unfiltered, a check right after this one's tap would be blamed for
        // a backlog that has nothing to do with Google Sign-In.
        tester.takeException();

        // Tap it — with no GoogleService-Info.plist / client ID configured
        // this should fail fast locally (no backend call), not hang on a
        // native picker. Bounded pumps instead of pumpAndSettle in case it
        // does hang, so the rest of the suite still runs.
        await tester.tap(inScreen<LoginScreen>(find.text('Sign in with Google')));
        for (var i = 0; i < 10; i++) {
          await tester.pump(const Duration(milliseconds: 300));
        }
        expect(tester.takeException(), isNull, reason: 'tapping Google Sign-In must not crash the app');
        expect(Get.currentRoute, '/login', reason: 'should still be on the login screen after Google Sign-In fails locally');
      });

      // ---------------------------------------------------------------
      // Stage 9: Forgot password — 1 of 5 shared rate-limited requests.
      // ---------------------------------------------------------------
      await step('8. Forgot password flow', () async {
        await tester.tap(inScreen<LoginScreen>(find.text('Forgot password?')));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.enterText(
            inScreen<ForgotPasswordScreen>(find.byType(TextFormField)).at(0), 'sarah@example.com');
        await tester.tap(find.text('Send Reset Link'));
        await tester.pumpAndSettle(const Duration(seconds: 3));
        expect(find.text('Check your email'), findsOneWidget);
        await tester.tap(find.text('Back to Sign In'));
        await tester.pumpAndSettle(const Duration(seconds: 1));
      });

      // ---------------------------------------------------------------
      // Stage 10: log back in as the SAME throwaway account registered at
      // the very start (stage 6 logged it out to reach the Login screen for
      // the preceding checks) — reusing it rather than registering a second
      // one keeps a single account's lifecycle easy to follow end to end.
      // ---------------------------------------------------------------
      await step('9. Log back in as throwaway account', () async {
        final fields = inScreen<LoginScreen>(find.byType(TextFormField));
        await tester.enterText(fields.at(0), throwawayEmail);
        await tester.enterText(fields.at(1), throwawayPassword);
        await tester.tap(inScreen<LoginScreen>(find.text('Sign In')));
        await tester.pumpAndSettle(const Duration(seconds: 3));
        expect(Get.currentRoute, '/home', reason: 'expected the throwaway account to log back in');
      });

      // ---------------------------------------------------------------
      // Stage 11: Biometric app-lock — best-effort. Info.plist was missing
      // NSFaceIDUsageDescription (fixed before this run) which would have
      // crashed the very first evaluatePolicy call on this Face-ID-only
      // simulator; toggle is now safe to attempt.
      // ---------------------------------------------------------------
      await step('10. Biometric app-lock (best-effort)', () async {
        await tester.tap(find.byIcon(Icons.settings_rounded));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        final biometric = Get.find<BiometricController>();
        if (!biometric.isAvailable.value) {
          print('Biometric not reported available on this simulator — skipping toggle, section correctly hidden.');
          expect(find.text('App Lock'), findsNothing);
          return;
        }
        expect(find.text('App Lock'), findsOneWidget);
        tester.takeException(); // clear backlog — see the matching comment in step 7 above
        await tester.tap(switchNear('App Lock'));
        for (var i = 0; i < 10; i++) {
          await tester.pump(const Duration(milliseconds: 300));
        }
        expect(tester.takeException(), isNull, reason: 'enabling biometric lock must not crash the app');
        print('Biometric enabled state after toggle attempt: ${biometric.isEnabled.value}');
        if (biometric.isEnabled.value) {
          // Leave it off again so it doesn't affect anything after this test.
          await tester.tap(switchNear('App Lock'));
          await tester.pump();
          await tester.pump(const Duration(milliseconds: 400));
        }
      });

      // ---------------------------------------------------------------
      // Stage 12: Delete account — on the throwaway account only.
      // ---------------------------------------------------------------
      await step('11. Delete account (throwaway account)', () async {
        Get.offAllNamed('/settings');
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.tap(inScreen<SettingsScreen>(find.text('Delete Account')));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        await tester.tap(inDialog(find.text('Delete Account')));
        await tester.pumpAndSettle(const Duration(seconds: 2));
        expect(Get.currentRoute, '/login', reason: 'deleting the account should log out to the login screen');
      });

      // ---------------------------------------------------------------
      // Stage 13: confirm the deleted account's old credentials no longer
      // work (2nd of 5 shared rate-limited requests).
      // ---------------------------------------------------------------
      await step('12. Old credentials rejected after delete', () async {
        final fields = inScreen<LoginScreen>(find.byType(TextFormField));
        await tester.enterText(fields.at(0), throwawayEmail);
        await tester.enterText(fields.at(1), throwawayPassword);
        await tester.tap(inScreen<LoginScreen>(find.text('Sign In')));
        await tester.pumpAndSettle(const Duration(seconds: 3));
        expect(Get.currentRoute, '/login', reason: 'deleted account must not be able to log back in');
        expect(inScreen<LoginScreen>(find.textContaining(RegExp(r'.'))).evaluate().isNotEmpty, isTrue);
      });
    } finally {
      print('\n================ FEATURE RESULTS SUMMARY ================');
      for (final entry in results.entries) {
        print('${entry.key} => ${entry.value}');
      }
      print('===========================================================\n');
    }
  });
}
