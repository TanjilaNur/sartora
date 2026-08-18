import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/profile_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../../data/models/address_model.dart';

class AddressFormScreen extends StatefulWidget {
  final AddressModel? existing;
  const AddressFormScreen({super.key, this.existing});

  @override
  State<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends State<AddressFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _label;
  late final TextEditingController _street;
  late final TextEditingController _city;
  late final TextEditingController _state;
  late final TextEditingController _zip;
  late final TextEditingController _country;
  bool _isDefault = false;
  late final ProfileController _ctrl;

  bool get _editing => widget.existing != null;

  @override
  void initState() {
    super.initState();
    _ctrl = Get.find<ProfileController>();
    final e = widget.existing;
    _label = TextEditingController(text: e?.label ?? 'Home');
    _street = TextEditingController(text: e?.street ?? '');
    _city = TextEditingController(text: e?.city ?? '');
    _state = TextEditingController(text: e?.state ?? '');
    _zip = TextEditingController(text: e?.zip ?? '');
    _country = TextEditingController(text: e?.country ?? 'US');
    _isDefault = e?.isDefault ?? false;
  }

  @override
  void dispose() {
    _label.dispose();
    _street.dispose();
    _city.dispose();
    _state.dispose();
    _zip.dispose();
    _country.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final input = AddressModel(
      id: widget.existing?.id ?? '',
      label: _label.text.trim(),
      street: _street.text.trim(),
      city: _city.text.trim(),
      state: _state.text.trim(),
      zip: _zip.text.trim(),
      country: _country.text.trim(),
      isDefault: _isDefault,
    );
    final ok = _editing ? await _ctrl.updateAddress(widget.existing!.id, input) : await _ctrl.addAddress(input);
    if (ok) {
      Get.back();
    } else if (_ctrl.errorMessage.value.isNotEmpty) {
      Get.snackbar('Could not save address', _ctrl.errorMessage.value, backgroundColor: AppColors.danger, colorText: AppColors.white);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        iconTheme: const IconThemeData(color: AppColors.white),
        title: Text(_editing ? 'Edit Address' : 'Add Address',
            style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w700, fontFamily: 'Inter', fontSize: 20)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: context.surfaceColor,
              borderRadius: BorderRadius.circular(14),
              boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 4, offset: Offset(0, 1))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _Field(controller: _label, label: 'Label (e.g. Home, Work)'),
                const SizedBox(height: 14),
                _Field(controller: _street, label: 'Street Address', required: true),
                const SizedBox(height: 14),
                Row(children: [
                  Expanded(child: _Field(controller: _city, label: 'City', required: true)),
                  const SizedBox(width: 12),
                  Expanded(child: _Field(controller: _state, label: 'State', required: true)),
                ]),
                const SizedBox(height: 14),
                Row(children: [
                  Expanded(child: _Field(controller: _zip, label: 'ZIP Code', required: true, keyboardType: TextInputType.number)),
                  const SizedBox(width: 12),
                  Expanded(child: _Field(controller: _country, label: 'Country', required: true)),
                ]),
                const SizedBox(height: 8),
                // CheckboxListTile paints its ink splash on the nearest
                // Material ancestor — the enclosing form Container's
                // DecoratedBox has nothing for it to paint onto otherwise,
                // hiding the tap feedback entirely.
                Material(
                  type: MaterialType.transparency,
                  child: CheckboxListTile(
                    value: _isDefault,
                    onChanged: (v) => setState(() => _isDefault = v ?? false),
                    contentPadding: EdgeInsets.zero,
                    controlAffinity: ListTileControlAffinity.leading,
                    activeColor: AppColors.primary,
                    title: Text('Set as default address', style: TextStyle(fontSize: 14, fontFamily: 'Inter', color: context.textPrimary)),
                  ),
                ),
                const SizedBox(height: 12),
                Obx(() => SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _ctrl.isLoading.value ? null : _save,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: _ctrl.isLoading.value
                            ? const SizedBox(
                                width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.white))
                            : Text(_editing ? 'Save Changes' : 'Add Address',
                                style: const TextStyle(color: AppColors.white, fontFamily: 'Inter', fontWeight: FontWeight.w600, fontSize: 15)),
                      ),
                    )),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final bool required;
  final TextInputType? keyboardType;

  const _Field({required this.controller, required this.label, this.required = false, this.keyboardType});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, fontFamily: 'Inter', color: context.textPrimary)),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          validator: required ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null : null,
          style: TextStyle(fontSize: 14, fontFamily: 'Inter', color: context.textPrimary),
          decoration: InputDecoration(
            filled: true,
            fillColor: context.pageBackground,
            contentPadding: const EdgeInsets.all(14),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.borderColor)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.borderColor)),
            focusedBorder:
                OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
            errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.danger)),
          ),
        ),
      ],
    );
  }
}
