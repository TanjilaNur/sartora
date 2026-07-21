import 'package:flutter_test/flutter_test.dart';
import 'package:app/main.dart';

void main() {
  testWidgets('App smoke test — renders without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(const DressShopApp());
    await tester.pump();
    expect(find.byType(DressShopApp), findsOneWidget);
  });
}
