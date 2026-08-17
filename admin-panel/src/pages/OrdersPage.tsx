import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Select,
  Input,
  Space,
  Typography,
  message,
  Card,
  Tag,
  Descriptions,
  Divider,
  Spin,
} from 'antd';
import { EyeOutlined, OrderedListOutlined, FileTextOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Order, OrderStatus } from '../types/order';
import type { Invoice } from '../api/orderApi';
import { fetchAllOrders, updateOrderStatus, fetchOrderInvoice } from '../api/orderApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'orange',
  processing: 'blue',
  shipped: 'geekblue',
  delivered: 'green',
  cancelled: 'red',
};

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: 'orange',
  paid: 'green',
  failed: 'red',
  refunded: 'purple',
};

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function userName(user: Order['user']): string {
  if (typeof user === 'string') return user;
  return user.name || user.email || user._id;
}

function userEmail(user: Order['user']): string {
  if (typeof user === 'string') return '';
  return user.email ?? '';
}

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [savingTracking, setSavingTracking] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const load = useCallback(async (p = page) => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await fetchAllOrders(token, { page: p, limit: 10 });
      setOrders(result.orders);
      setTotal(result.total);
    } catch {
      message.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => { load(); }, [load]);

  function openDetail(order: Order) {
    setSelectedOrder(order);
    setTrackingNumber(order.trackingNumber ?? '');
    setCarrier(order.carrier ?? '');
    setDetailOpen(true);
  }

  async function openInvoice(order: Order) {
    if (!token) return;
    setInvoice(null);
    setInvoiceOpen(true);
    setInvoiceLoading(true);
    try {
      const inv = await fetchOrderInvoice(token, order._id);
      setInvoice(inv);
    } catch {
      message.error('Failed to load invoice');
      setInvoiceOpen(false);
    } finally {
      setInvoiceLoading(false);
    }
  }

  async function handleStatusChange(status: OrderStatus) {
    if (!token || !selectedOrder) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateOrderStatus(token, selectedOrder._id, status);
      message.success(`Order marked as "${status}"`);
      setSelectedOrder({ ...selectedOrder, status: updated.status });
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? { ...o, status: updated.status } : o))
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Status update failed';
      message.error(msg);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleSaveTracking() {
    if (!token || !selectedOrder) return;
    setSavingTracking(true);
    try {
      // Send the trimmed value as-is, including an empty string when the
      // admin cleared the field — `|| undefined` here would silently drop
      // the key during JSON serialization (JSON.stringify omits
      // undefined-valued keys entirely), so the backend would never learn a
      // clear was requested and the old value would stick around forever.
      // The backend's own `.trim() || undefined` on its side is what
      // actually turns "" into a cleared field once it arrives.
      const updated = await updateOrderStatus(token, selectedOrder._id, selectedOrder.status, {
        trackingNumber: trackingNumber.trim(),
        carrier: carrier.trim(),
      });
      message.success('Tracking info updated');
      setSelectedOrder({ ...selectedOrder, trackingNumber: updated.trackingNumber, carrier: updated.carrier });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === updated._id ? { ...o, trackingNumber: updated.trackingNumber, carrier: updated.carrier } : o
        )
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to update tracking info';
      message.error(msg);
    } finally {
      setSavingTracking(false);
    }
  }

  const columns: ColumnsType<Order> = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: '_id',
      width: 200,
      render: (id: string) => (
        <Text code style={{ fontSize: 12 }}>
          {id.slice(-8).toUpperCase()}
        </Text>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: unknown, record: Order) => (
        <div>
          <div style={{ fontWeight: 500, color: '#111827' }}>{userName(record.user)}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{userEmail(record.user)}</div>
        </div>
      ),
    },
    {
      title: 'Items',
      key: 'items',
      width: 70,
      render: (_: unknown, record: Order) => (
        <Tag color="purple">{record.items.length}</Tag>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 110,
      sorter: (a: Order, b: Order) => a.total - b.total,
      render: (total: number) => (
        <span style={{ fontWeight: 600, color: '#111827' }}>${total.toFixed(2)}</span>
      ),
    },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 110,
      render: (s: string) => (
        <Tag color={PAYMENT_COLORS[s] ?? 'default'}>{s.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: OrderStatus) => (
        <Tag color={STATUS_COLORS[s]}>{s.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_: unknown, record: Order) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>
            View
          </Button>
          <Button size="small" icon={<FileTextOutlined />} onClick={() => openInvoice(record)}>
            Invoice
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={styles.pageHeader}>
        <Space>
          <OrderedListOutlined style={{ fontSize: 22, color: '#660033' }} />
          <Title level={3} style={{ margin: 0 }}>Orders</Title>
        </Space>
      </div>

      <Card style={styles.card}>
        <Table
          rowKey="_id"
          dataSource={orders}
          columns={columns}
          loading={loading}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            showTotal: (t: number) => `${t} orders`,
            onChange: (p: number) => { setPage(p); load(p); },
          }}
        />
      </Card>

      <Modal
        title={invoice ? `Invoice — ${invoice.invoiceNumber}` : 'Invoice'}
        open={invoiceOpen}
        onCancel={() => setInvoiceOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        {invoiceLoading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        )}
        {invoice && !invoiceLoading && (
          <div style={{ fontFamily: "'Inter', sans-serif" }}>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Invoice #" span={2}>
                <Text strong>{invoice.invoiceNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Issued">
                {new Date(invoice.issuedAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Payment">
                {invoice.order.paymentMethod}
              </Descriptions.Item>
              <Descriptions.Item label="Order Status">
                <Tag color={STATUS_COLORS[invoice.order.status as OrderStatus] ?? 'default'}>
                  {invoice.order.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                <Tag color={PAYMENT_COLORS[invoice.order.paymentStatus] ?? 'default'}>
                  {invoice.order.paymentStatus.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ship To" span={2}>
                {[
                  invoice.shippingAddress.street,
                  invoice.shippingAddress.city,
                  invoice.shippingAddress.state,
                  invoice.shippingAddress.zip,
                  invoice.shippingAddress.country,
                ].join(', ')}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ fontSize: 13, color: '#4B5563' }}>Line Items</Divider>

            {invoice.lineItems.map((item, i) => (
              <div key={i} style={styles.item}>
                <div>
                  <Text strong>{item.name}</Text>
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    x{item.quantity} @ ${item.unitPrice.toFixed(2)}
                  </Text>
                </div>
                <Text style={{ fontWeight: 600 }}>${item.subtotal.toFixed(2)}</Text>
              </div>
            ))}

            <div style={{ ...styles.item, borderBottom: 'none', marginTop: 8 }}>
              <Text type="secondary">Subtotal</Text>
              <Text>${invoice.subtotal.toFixed(2)}</Text>
            </div>
            <div style={{ ...styles.item, borderBottom: 'none' }}>
              <Text strong style={{ fontSize: 15 }}>Total</Text>
              <Text strong style={{ fontSize: 15, color: '#660033' }}>
                ${invoice.total.toFixed(2)}
              </Text>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Order Details"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        {selectedOrder && (
          <>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Order ID" span={2}>
                <Text code>{selectedOrder._id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {userName(selectedOrder.user)}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {userEmail(selectedOrder.user)}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method">
                {selectedOrder.paymentDetails.method}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                <Tag color={PAYMENT_COLORS[selectedOrder.paymentStatus]}>
                  {selectedOrder.paymentStatus.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Subtotal">${selectedOrder.subtotal.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Discount">
                {selectedOrder.discount > 0
                  ? `-$${selectedOrder.discount.toFixed(2)}${selectedOrder.promoCode ? ` (${selectedOrder.promoCode})` : ''}`
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Total" span={2}>
                <strong>${selectedOrder.total.toFixed(2)}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Shipping Address" span={2}>
                {[
                  selectedOrder.address.street,
                  selectedOrder.address.city,
                  selectedOrder.address.state,
                  selectedOrder.address.zip,
                  selectedOrder.address.country,
                ].join(', ')}
              </Descriptions.Item>
              <Descriptions.Item label="Placed On" span={2}>
                {new Date(selectedOrder.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ fontSize: 13, color: '#4B5563' }}>
              Items
            </Divider>

            {selectedOrder.items.map((item, i) => (
              <div key={i} style={styles.item}>
                <div>
                  <Text strong>{item.name}</Text>
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    x{item.quantity}
                  </Text>
                </div>
                <Text style={{ fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</Text>
              </div>
            ))}

            <Divider style={{ fontSize: 13, color: '#4B5563', marginTop: 20 }}>
              Update Status
            </Divider>

            <Space>
              <Select
                value={selectedOrder.status}
                options={STATUS_OPTIONS.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                style={{ width: 180 }}
                onChange={(v: OrderStatus) => handleStatusChange(v)}
                loading={updatingStatus}
              />
              <Tag color={STATUS_COLORS[selectedOrder.status]}>
                {selectedOrder.status.toUpperCase()}
              </Tag>
            </Space>

            <Divider style={{ fontSize: 13, color: '#4B5563', marginTop: 20 }}>
              Shipping / Tracking
            </Divider>

            <Space style={{ display: 'flex', marginBottom: 12 }} size={16}>
              <div style={{ flex: 1 }}>
                <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#4B5563' }}>
                  Carrier
                </Text>
                <Input
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g. UPS, FedEx, USPS"
                />
              </div>
              <div style={{ flex: 1 }}>
                <Text style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#4B5563' }}>
                  Tracking Number
                </Text>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 1Z999AA10123456784"
                />
              </div>
            </Space>
            <Button type="primary" onClick={handleSaveTracking} loading={savingTracking}>
              Save Tracking Info
            </Button>
          </>
        )}
      </Modal>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    borderRadius: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #F3F4F6',
  },
};
