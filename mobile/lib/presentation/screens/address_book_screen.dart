import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/profile_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../../data/models/address_model.dart';

class AddressBookScreen extends StatefulWidget {
  const AddressBookScreen({super.key});

  @override
  State<AddressBookScreen> createState() => _AddressBookScreenState();
}

class _AddressBookScreenState extends State<AddressBookScreen> {
  late final ProfileController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = Get.find<ProfileController>();
    _ctrl.loadAddresses();
  }

  Future<void> _delete(AddressModel address) async {
    final confirmed = await Get.dialog<bool>(AlertDialog(
      title: const Text('Remove address?'),
      content: Text('Delete "${address.label}"? This can\'t be undone.'),
      actions: [
        TextButton(onPressed: () => Get.back(result: false), child: const Text('Cancel')),
        TextButton(onPressed: () => Get.back(result: true), child: const Text('Delete', style: TextStyle(color: AppColors.danger))),
      ],
    ));
    if (confirmed == true) await _ctrl.deleteAddress(address.id);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        iconTheme: const IconThemeData(color: AppColors.white),
        title: const Text('My Addresses',
            style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w700, fontFamily: 'Inter', fontSize: 20)),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        onPressed: () => Get.toNamed('/address-form'),
        child: const Icon(Icons.add_rounded, color: AppColors.white),
      ),
      body: Obx(() {
        if (_ctrl.isLoading.value && _ctrl.addresses.isEmpty) {
          return const Center(child: CircularProgressIndicator(color: AppColors.primary));
        }
        if (_ctrl.addresses.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.location_on_outlined, size: 48, color: context.textSecondary),
                  const SizedBox(height: 12),
                  Text('No saved addresses yet', style: TextStyle(color: context.textSecondary, fontFamily: 'Inter', fontSize: 14)),
                ],
              ),
            ),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: _ctrl.addresses.length,
          itemBuilder: (_, i) {
            final a = _ctrl.addresses[i];
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.surfaceColor,
                borderRadius: BorderRadius.circular(12),
                border: a.isDefault ? Border.all(color: AppColors.primary, width: 1.5) : null,
                boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 4, offset: Offset(0, 1))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(a.label,
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, fontFamily: 'Inter', color: context.textPrimary)),
                      if (a.isDefault) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
                          child: const Text('DEFAULT',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.primary, fontFamily: 'Inter')),
                        ),
                      ],
                      const Spacer(),
                      PopupMenuButton<String>(
                        icon: Icon(Icons.more_vert_rounded, color: context.textSecondary),
                        onSelected: (v) {
                          if (v == 'edit') {
                            Get.toNamed('/address-form', arguments: a);
                          } else if (v == 'delete') {
                            _delete(a);
                          } else if (v == 'default') {
                            _ctrl.updateAddress(
                              a.id,
                              AddressModel(
                                id: a.id,
                                label: a.label,
                                street: a.street,
                                city: a.city,
                                state: a.state,
                                zip: a.zip,
                                country: a.country,
                                isDefault: true,
                              ),
                            );
                          }
                        },
                        itemBuilder: (_) => [
                          const PopupMenuItem(value: 'edit', child: Text('Edit')),
                          if (!a.isDefault) const PopupMenuItem(value: 'default', child: Text('Set as default')),
                          const PopupMenuItem(value: 'delete', child: Text('Delete', style: TextStyle(color: AppColors.danger))),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(a.oneLine, style: TextStyle(fontSize: 13, color: context.textSecondary, fontFamily: 'Inter')),
                ],
              ),
            );
          },
        );
      }),
    );
  }
}
