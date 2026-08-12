import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Space,
  Typography,
  message,
  Card,
  Tag,
  Descriptions,
  Select,
  Popconfirm,
  Statistic,
  Row,
  Col,
} from 'antd';
import { CreditCardOutlined, RedoOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Transaction, TransactionStatus } from '../types/transaction';
import { fetchAllTransactions, refundTransaction } from '../api/paymentApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const STATUS_COLORS: Record<TransactionStatus, string> = {
  pending: 'orange',
  succeeded: 'green',
  failed: 'red',
  refunded: 'purple',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'succeeded', label: 'Succeeded' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

function getOrderId(tx: Transaction): string | null {
  if (!tx.order) return null;
  if (typeof tx.order === 'string') return tx.order;
  return tx.order._id;
}

function getOrderTotal(tx: Transaction): number | null {
  if (!tx.order) return null;
  if (typeof tx.order === 'string') return tx.amount / 100;
  return tx.order.total;
}

function getUserName(tx: Transaction): string {
  if (!tx.user) return 'Deleted user';
  if (typeof tx.user === 'string') return tx.user;
  return tx.user.name || tx.user.email || tx.user._id;
}

function getUserEmail(tx: Transaction): string {
  if (!tx.user || typeof tx.user === 'string') return '';
  return tx.user.email ?? '';
}

export default function PaymentsPage() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const load = useCallback(async (p = page, status = statusFilter) => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await fetchAllTransactions(token, {
        page: p,
        limit: 10,
        status: status || undefined,
      });
      setTransactions(result.transactions);
      setTotal(result.total);
    } catch {
      message.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [token, page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value);
    setPage(1);
    load(1, value);
  }

  function openDetail(tx: Transaction) {
    setSelected(tx);
    setDetailOpen(true);
  }

  async function handleRefund(tx: Transaction) {
    if (!token) return;
    const orderId = getOrderId(tx);
    if (!orderId) {
      message.error('Cannot refund: the order for this transaction no longer exists.');
      return;
    }
    setRefunding(true);
    try {
      await refundTransaction(token, orderId);
      message.success('Refund initiated successfully');
      setDetailOpen(false);
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Refund failed';
      message.error(msg);
    } finally {
      setRefunding(false);
    }
  }

  const succeededCount = transactions.filter((t) => t.status === 'succeeded').length;
  const totalRevenue = transactions
    .filter((t) => t.status === 'succeeded')
    .reduce((sum, t) => sum + t.amount / 100, 0);

  const columns: ColumnsType<Transaction> = [
    {
      title: 'Transaction ID',
      dataIndex: 'stripePaymentIntentId',
      key: 'id',
      width: 220,
      render: (id: string) => (
        <Text code style={{ fontSize: 11 }}>
          {id.slice(0, 20)}…
        </Text>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: unknown, record: Transaction) => (
        <div>
          <div style={{ fontWeight: 500, color: '#111827' }}>{getUserName(record)}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{getUserEmail(record)}</div>
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 110,
      render: (amount: number, record: Transaction) => (
        <span style={{ fontWeight: 600, color: '#111827' }}>
          ${(amount / 100).toFixed(2)} {record.currency.toUpperCase()}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: TransactionStatus) => (
        <Tag color={STATUS_COLORS[s]}>{s.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      render: (_: unknown, record: Transaction) => (
        <Button size="small" icon={<CreditCardOutlined />} onClick={() => openDetail(record)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={styles.pageHeader}>
        <Space>
          <CreditCardOutlined style={{ fontSize: 22, color: '#660033' }} />
          <Title level={3} style={{ margin: 0 }}>Payments</Title>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card style={styles.statCard}>
            <Statistic
              title="Showing (page)"
              value={succeededCount}
              suffix={`/ ${transactions.length} succeeded`}
              valueStyle={{ color: '#10B981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={styles.statCard}>
            <Statistic
              title="Page Revenue"
              prefix="$"
              value={totalRevenue.toFixed(2)}
              valueStyle={{ color: '#660033' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={styles.statCard}>
            <Statistic
              title="Total Transactions"
              value={total}
              valueStyle={{ color: '#111827' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={styles.card}>
        <div style={{ marginBottom: 16 }}>
          <Select
            value={statusFilter}
            options={STATUS_OPTIONS}
            style={{ width: 180 }}
            onChange={handleStatusFilterChange}
          />
        </div>
        <Table
          rowKey="_id"
          dataSource={transactions}
          columns={columns}
          loading={loading}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            showTotal: (t: number) => `${t} transactions`,
            onChange: (p: number) => { setPage(p); load(p); },
          }}
        />
      </Card>

      <Modal
        title="Transaction Details"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        {selected && (
          <>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Payment Intent" span={2}>
                <Text code style={{ fontSize: 11 }}>{selected.stripePaymentIntentId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {getUserName(selected)}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {getUserEmail(selected)}
              </Descriptions.Item>
              <Descriptions.Item label="Amount">
                <strong>${(selected.amount / 100).toFixed(2)} {selected.currency.toUpperCase()}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Order Total">
                {getOrderTotal(selected) !== null
                  ? `$${getOrderTotal(selected)!.toFixed(2)}`
                  : <Text type="secondary">Order deleted</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag color={STATUS_COLORS[selected.status]}>{selected.status.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Order ID" span={2}>
                {getOrderId(selected) ? (
                  <Text code style={{ fontSize: 11 }}>{getOrderId(selected)}</Text>
                ) : (
                  <Text type="secondary">Order deleted</Text>
                )}
              </Descriptions.Item>
              {selected.stripeRefundId && (
                <Descriptions.Item label="Refund ID" span={2}>
                  <Text code style={{ fontSize: 11 }}>{selected.stripeRefundId}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Created" span={2}>
                {new Date(selected.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {selected.status === 'succeeded' && getOrderId(selected) && (
              <div style={{ marginTop: 16 }}>
                <Popconfirm
                  title="Issue refund for this transaction?"
                  description="This will refund the full amount via Stripe and cancel the order."
                  onConfirm={() => handleRefund(selected)}
                  okText="Yes, refund"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    danger
                    icon={<RedoOutlined />}
                    loading={refunding}
                  >
                    Issue Refund
                  </Button>
                </Popconfirm>
              </div>
            )}
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
  statCard: {
    borderRadius: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
};
