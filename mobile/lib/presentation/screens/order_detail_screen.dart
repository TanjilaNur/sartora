import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/order_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../core/theme/theme_extensions.dart';
import '../../data/models/order_model.dart';
import '../../data/models/invoice_model.dart';
import '../../data/models/refund_model.dart';

class OrderDetailScreen extends StatefulWidget {
  const OrderDetailScreen({super.key});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  late OrderModel _order;
  RefundModel? _refund;
  bool _loadingInvoice = false;
  bool _loadingRefund = false;
  bool _cancelling = false;

  @override
  void initState() {
    super.initState();
    _order = Get.arguments as OrderModel;
    _loadRefundStatus();
  }

  Future<void> _loadRefundStatus() async {
    final ctrl = Get.find<OrderController>();
    final refund = await ctrl.fetchRefundStatus(_order.orderId);
    if (mounted) setState(() => _refund = refund);
  }

  Future<void> _loadInvoice() async {
    setState(() => _loadingInvoice = true);
    final ctrl = Get.find<OrderController>();
    final invoice = await ctrl.fetchInvoice(_order.orderId);
    if (mounted) {
      setState(() => _loadingInvoice = false);
      if (invoice != null) {
        _showInvoiceSheet(invoice);
      }
    }
  }

  void _showInvoiceSheet(InvoiceModel invoice) {
    Get.bottomSheet(
      _InvoiceSheet(invoice: invoice),
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
    );
  }

  Future<void> _confirmCancel() async {
    final confirmed = await Get.dialog<bool>(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Text('Cancel Order',
            style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700)),
        content: Text(
          'Are you sure you want to cancel this order?',
          style: TextStyle(fontFamily: 'Inter', color: context.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(result: false),
            child: Text('No',
                style: TextStyle(color: context.textSecondary, fontFamily: 'Inter')),
          ),
          ElevatedButton(
            onPressed: () => Get.back(result: true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Cancel Order',
                style: TextStyle(color: AppColors.white, fontFamily: 'Inter')),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _cancelling = true);
    final ctrl = Get.find<OrderController>();
    final success = await ctrl.cancelOrder(_order.orderId);
    if (success && mounted) {
      Get.back();
    }
    if (mounted) setState(() => _cancelling = false);
  }

  void _showRefundDialog() {
    final reasonCtrl = TextEditingController();
    Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Text('Request Refund',
            style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Please describe your reason for requesting a refund:',
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 13,
                color: context.textSecondary,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'e.g. Wrong size, item damaged...',
                hintStyle: TextStyle(
                    fontFamily: 'Inter', color: context.borderColor),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide:
                        BorderSide(color: context.borderColor)),
                focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide:
                        const BorderSide(color: AppColors.primary, width: 1.5)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: Text('Cancel',
                style: TextStyle(
                    color: context.textSecondary, fontFamily: 'Inter')),
          ),
          ElevatedButton(
            onPressed: () async {
              final reason = reasonCtrl.text.trim();
              if (reason.isEmpty) {
                Get.snackbar('Required', 'Please enter a reason.',
                    snackPosition: SnackPosition.BOTTOM);
                return;
              }
              Get.back();
              setState(() => _loadingRefund = true);
              final ctrl = Get.find<OrderController>();
              final refund = await ctrl.requestRefund(_order.orderId, reason);
              if (mounted) {
                setState(() {
                  _refund = refund;
                  _loadingRefund = false;
                });
              }
            },
            style:
                ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Submit',
                style: TextStyle(color: AppColors.white, fontFamily: 'Inter')),
          ),
        ],
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'delivered':
        return AppColors.success;
      case 'cancelled':
        return AppColors.danger;
      case 'shipped':
        return AppColors.primary;
      case 'processing':
        return AppColors.warning;
      default:
        return AppColors.secondary;
    }
  }

  Color _paymentStatusColor(BuildContext context, String ps) {
    switch (ps) {
      case 'paid':
        return AppColors.success;
      case 'refunded':
        return AppColors.primary;
      case 'failed':
        return AppColors.danger;
      default:
        return context.textSecondary;
    }
  }

  bool get _canCancel => _order.status == 'pending';

  bool get _canRequestRefund =>
      (_order.paymentStatus == 'paid' || _order.status == 'delivered') &&
      _order.paymentStatus != 'refunded' &&
      _refund == null;

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColor(_order.status);

    return Scaffold(
      backgroundColor: context.pageBackground,
      appBar: AppBar(
        iconTheme: const IconThemeData(color: AppColors.white),
        title: const Text(
          'Order Details',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
            fontSize: 20,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header card
            _Card(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Order #${_order.orderId.length > 8 ? _order.orderId.substring(_order.orderId.length - 8).toUpperCase() : _order.orderId.toUpperCase()}',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: context.textPrimary,
                            fontFamily: 'Inter',
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          _order.status[0].toUpperCase() +
                              _order.status.substring(1),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: statusColor,
                            fontFamily: 'Inter',
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (_order.createdAt != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      _formatDate(_order.createdAt!),
                      style: TextStyle(
                        fontSize: 12,
                        color: context.textSecondary,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  _InfoRow(
                    label: 'Payment',
                    value: _order.paymentStatus[0].toUpperCase() +
                        _order.paymentStatus.substring(1),
                    valueColor: _paymentStatusColor(context, _order.paymentStatus),
                  ),
                  if (_order.paymentMethod != null) ...[
                    const SizedBox(height: 4),
                    _InfoRow(
                        label: 'Method',
                        value: _order.paymentMethod!
                            .replaceAll('_', ' ')
                            .toUpperCase()),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Items
            _Card(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Items',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: context.textPrimary,
                      fontFamily: 'Inter',
                    ),
                  ),
                  const SizedBox(height: 10),
                  ..._order.items.map(
                    (item) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 5),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              '${item.name} × ${item.quantity}',
                              style: TextStyle(
                                fontSize: 13,
                                color: context.textSecondary,
                                fontFamily: 'Inter',
                              ),
                            ),
                          ),
                          Text(
                            '\$${(item.price * item.quantity).toStringAsFixed(2)}',
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
                  Divider(color: context.borderColor, height: 24),
                  _PriceLine(label: 'Subtotal', amount: _order.subtotal),
                  if (_order.discount > 0) ...[
                    const SizedBox(height: 4),
                    _PriceLine(
                      label: 'Discount${_order.promoCode != null ? ' (${_order.promoCode})' : ''}',
                      amount: -_order.discount,
                      color: AppColors.success,
                    ),
                  ],
                  const SizedBox(height: 8),
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
                        '\$${_order.total.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Address
            if (_order.address != null)
              _Card(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Shipping Address',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: context.textPrimary,
                        fontFamily: 'Inter',
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${_order.address!.street}\n${_order.address!.city}, ${_order.address!.state} ${_order.address!.zip}\n${_order.address!.country}',
                      style: TextStyle(
                        fontSize: 13,
                        color: context.textSecondary,
                        fontFamily: 'Inter',
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),

            // Tracking — a flat status label communicates less than seeing
            // where an order actually sits in its journey, so this derives a
            // simple step tracker from the existing status enum rather than
            // needing a separate event-log the admin would have to maintain.
            if (_order.status != 'cancelled') ...[
              const SizedBox(height: 12),
              _TrackingCard(order: _order),
            ],

            // Refund status
            if (_refund != null) ...[
              const SizedBox(height: 12),
              _RefundStatusCard(refund: _refund!),
            ],

            const SizedBox(height: 24),

            // Action buttons
            _ActionButton(
              label: 'Reorder',
              icon: Icons.replay_rounded,
              color: AppColors.secondary,
              loading: false,
              onPressed: () => Get.find<OrderController>().reorder(_order),
            ),
            const SizedBox(height: 10),

            if (_canCancel)
              _ActionButton(
                label: 'Cancel Order',
                icon: Icons.cancel_outlined,
                color: AppColors.danger,
                loading: _cancelling,
                onPressed: _confirmCancel,
              ),

            if (_canRequestRefund && !_loadingRefund) ...[
              const SizedBox(height: 10),
              _ActionButton(
                label: 'Request Refund',
                icon: Icons.undo_rounded,
                color: AppColors.warning,
                loading: false,
                onPressed: _showRefundDialog,
              ),
            ],
            if (_loadingRefund)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child:
                      CircularProgressIndicator(color: AppColors.primary),
                ),
              ),

            const SizedBox(height: 10),
            _ActionButton(
              label: 'View Invoice',
              icon: Icons.receipt_long_outlined,
              color: AppColors.primary,
              loading: _loadingInvoice,
              onPressed: _loadInvoice,
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}, ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
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
      child: child,
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          '$label: ',
          style: TextStyle(
            fontSize: 13,
            color: context.textSecondary,
            fontFamily: 'Inter',
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: valueColor ?? context.textPrimary,
            fontFamily: 'Inter',
          ),
        ),
      ],
    );
  }
}

class _PriceLine extends StatelessWidget {
  final String label;
  final double amount;
  final Color? color;

  const _PriceLine({
    required this.label,
    required this.amount,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final resolvedColor = color ?? context.textSecondary;
    final display = amount < 0
        ? '-\$${(-amount).toStringAsFixed(2)}'
        : '\$${amount.toStringAsFixed(2)}';
    return Row(
      children: [
        Text(label,
            style: TextStyle(
                fontSize: 13, color: resolvedColor, fontFamily: 'Inter')),
        const Spacer(),
        Text(display,
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: resolvedColor,
                fontFamily: 'Inter')),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final bool loading;
  final VoidCallback onPressed;

  const _ActionButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.loading,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: loading ? null : onPressed,
        icon: loading
            ? const SizedBox(
                width: 16,
                height: 16,
                child:
                    CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : Icon(icon, color: AppColors.white, size: 18),
        label: Text(
          label,
          style: const TextStyle(
            color: AppColors.white,
            fontFamily: 'Inter',
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          padding: const EdgeInsets.symmetric(vertical: 13),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
    );
  }
}

class _TrackingCard extends StatelessWidget {
  final OrderModel order;
  const _TrackingCard({required this.order});

  static const _steps = ['pending', 'processing', 'shipped', 'delivered'];

  @override
  Widget build(BuildContext context) {
    final currentIndex = _steps.indexOf(order.status).clamp(0, _steps.length - 1);
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Order Tracking',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: context.textPrimary, fontFamily: 'Inter')),
          const SizedBox(height: 16),
          Row(
            children: List.generate(_steps.length * 2 - 1, (i) {
              if (i.isOdd) {
                final reached = (i ~/ 2) < currentIndex;
                return Expanded(child: Container(height: 2, color: reached ? AppColors.success : context.borderColor));
              }
              final stepIndex = i ~/ 2;
              final done = stepIndex <= currentIndex;
              return Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: done ? AppColors.success : context.pageBackground,
                  shape: BoxShape.circle,
                  border: Border.all(color: done ? AppColors.success : context.borderColor, width: 1.5),
                ),
                child: done ? const Icon(Icons.check_rounded, size: 14, color: AppColors.white) : null,
              );
            }),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: _steps
                .map((s) => Text(
                      s[0].toUpperCase() + s.substring(1),
                      style: TextStyle(
                        fontSize: 10,
                        fontFamily: 'Inter',
                        fontWeight: _steps.indexOf(s) == currentIndex ? FontWeight.w700 : FontWeight.w400,
                        color: _steps.indexOf(s) <= currentIndex ? AppColors.success : context.textSecondary,
                      ),
                    ))
                .toList(),
          ),
          if (order.trackingNumber != null && order.trackingNumber!.isNotEmpty) ...[
            Divider(color: context.borderColor, height: 28),
            _InfoRow(label: 'Carrier', value: order.carrier ?? '—'),
            const SizedBox(height: 4),
            _InfoRow(label: 'Tracking #', value: order.trackingNumber!),
          ],
        ],
      ),
    );
  }
}

class _RefundStatusCard extends StatelessWidget {
  final RefundModel refund;
  const _RefundStatusCard({required this.refund});

  Color _refundColor(String status) {
    switch (status) {
      case 'approved':
        return AppColors.success;
      case 'rejected':
        return AppColors.danger;
      default:
        return AppColors.secondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _refundColor(refund.status);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.undo_rounded, color: color, size: 16),
              const SizedBox(width: 6),
              Text(
                'Refund Request — ${refund.status[0].toUpperCase()}${refund.status.substring(1)}',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: color,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Reason: ${refund.reason}',
            style: TextStyle(
              fontSize: 12,
              color: context.textSecondary,
              fontFamily: 'Inter',
            ),
          ),
          if (refund.adminNote != null && refund.adminNote!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              'Note: ${refund.adminNote}',
              style: TextStyle(
                fontSize: 12,
                color: context.textSecondary,
                fontFamily: 'Inter',
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── Invoice bottom sheet ────────────────────────────────────────────────────

class _InvoiceSheet extends StatelessWidget {
  final InvoiceModel invoice;
  const _InvoiceSheet({required this.invoice});

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, scrollCtrl) => Container(
        decoration: BoxDecoration(
          color: context.surfaceColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: context.borderColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Expanded(
              child: ListView(
                controller: scrollCtrl,
                padding: const EdgeInsets.all(20),
                children: [
                  Row(
                    children: [
                      const Icon(Icons.receipt_long_rounded,
                          color: AppColors.primary, size: 22),
                      const SizedBox(width: 8),
                      Text(
                        'Invoice',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: context.textPrimary,
                          fontFamily: 'Inter',
                        ),
                      ),
                      const Spacer(),
                      GestureDetector(
                        onTap: () => Get.back(),
                        child: Icon(Icons.close_rounded,
                            color: context.textSecondary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _InvoiceRow(
                      label: 'Invoice #', value: invoice.invoiceNumber),
                  _InvoiceRow(
                      label: 'Date',
                      value: _formatDate(invoice.issuedAt)),
                  _InvoiceRow(
                      label: 'Order Status', value: invoice.orderStatus),
                  _InvoiceRow(
                      label: 'Payment',
                      value: invoice.paymentStatus[0].toUpperCase() +
                          invoice.paymentStatus.substring(1)),
                  _InvoiceRow(
                      label: 'Method',
                      value: invoice.paymentMethod
                          .replaceAll('_', ' ')
                          .toUpperCase()),
                  Divider(color: context.borderColor, height: 28),
                  Text(
                    'Ship To',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: context.textPrimary,
                      fontFamily: 'Inter',
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${invoice.shippingAddress.street}\n${invoice.shippingAddress.city}, ${invoice.shippingAddress.state} ${invoice.shippingAddress.zip}\n${invoice.shippingAddress.country}',
                    style: TextStyle(
                      fontSize: 13,
                      color: context.textSecondary,
                      fontFamily: 'Inter',
                      height: 1.5,
                    ),
                  ),
                  Divider(color: context.borderColor, height: 28),
                  Text(
                    'Line Items',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: context.textPrimary,
                      fontFamily: 'Inter',
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...invoice.lineItems.map(
                    (item) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 5),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              '${item.name} × ${item.quantity}',
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
                  Divider(color: context.borderColor, height: 24),
                  _InvoicePriceLine(
                      label: 'Subtotal', amount: invoice.subtotal),
                  const SizedBox(height: 4),
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
                        '\$${invoice.total.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return iso;
    }
  }
}

class _InvoiceRow extends StatelessWidget {
  final String label;
  final String value;
  const _InvoiceRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: context.textSecondary,
              fontFamily: 'Inter',
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: context.textPrimary,
              fontFamily: 'Inter',
            ),
          ),
        ],
      ),
    );
  }
}

class _InvoicePriceLine extends StatelessWidget {
  final String label;
  final double amount;
  const _InvoicePriceLine({required this.label, required this.amount});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(label,
            style: TextStyle(
                fontSize: 13,
                color: context.textSecondary,
                fontFamily: 'Inter')),
        const Spacer(),
        Text('\$${amount.toStringAsFixed(2)}',
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: context.textSecondary,
                fontFamily: 'Inter')),
      ],
    );
  }
}
