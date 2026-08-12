import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Typography,
  message,
  Card,
  Tag,
  Badge,
  Statistic,
  Row,
  Col,
  Drawer,
  Descriptions,
  Empty,
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  EyeOutlined,
  TeamOutlined,
  DollarOutlined,
  ShoppingOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Customer, CustomerProfile } from '../types/customer';
import type { Order, OrderStatus, PaymentStatus } from '../types/order';
import { fetchCustomers, fetchCustomerProfile } from '../api/customerApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Search } = Input;

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'orange',
  processing: 'blue',
  shipped: 'geekblue',
  delivered: 'green',
  cancelled: 'red',
};

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  unpaid: 'orange',
  paid: 'green',
  failed: 'red',
  refunded: 'purple',
};

export default function CustomersPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  // Same request-generation guard used on the Guest Sessions page: only the
  // response matching the most recently issued request is ever applied.
  const requestIdRef = useRef(0);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  const load = useCallback(
    async (p = page, s = search) => {
      if (!token) return;
      const requestId = ++requestIdRef.current;
      setLoading(true);
      try {
        const data = await fetchCustomers(token, { page: p, limit, search: s || undefined });
        if (requestId !== requestIdRef.current) return;
        setCustomers(data.customers);
        setTotal(data.total);
      } catch {
        if (requestId === requestIdRef.current) message.error('Failed to load customers');
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [token, page, search]
  );

  useEffect(() => {
    load();
  }, [load]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
    load(1, value);
  }

  async function openProfile(userId: string) {
    if (!token) return;
    setProfileOpen(true);
    setProfileLoading(true);
    setProfile(null);
    try {
      const data = await fetchCustomerProfile(token, userId);
      setProfile(data);
    } catch {
      message.error('Failed to load customer profile');
      setProfileOpen(false);
    } finally {
      setProfileLoading(false);
    }
  }

  const revenueOnPage = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  const columns: ColumnsType<Customer> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Customer) => (
        <div>
          <div style={{ fontWeight: 500, color: '#111827' }}>{name}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: 'Orders',
      dataIndex: 'orderCount',
      key: 'orderCount',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.orderCount - b.orderCount,
      render: (count: number) => <Badge count={count} showZero color={count > 0 ? '#660033' : '#D1D5DB'} />,
    },
    {
      title: 'Lifetime Spend',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      width: 140,
      sorter: (a, b) => a.totalSpent - b.totalSpent,
      render: (v: number) => <span style={{ fontWeight: 600, color: '#111827' }}>${v.toFixed(2)}</span>,
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (v: string) => <Text style={{ color: '#6B7280', fontSize: 13 }}>{new Date(v).toLocaleDateString()}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      render: (_: unknown, record: Customer) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => openProfile(record._id)}>
          View
        </Button>
      ),
    },
  ];

  const orderColumns: ColumnsType<Order> = [
    {
      title: 'Order',
      dataIndex: '_id',
      key: '_id',
      width: 110,
      render: (id: string) => <Text code style={{ fontSize: 12 }}>{id.slice(-8).toUpperCase()}</Text>,
    },
    {
      title: 'Items',
      key: 'items',
      width: 70,
      align: 'center',
      render: (_: unknown, r: Order) => <Tag color="purple">{r.items.length}</Tag>,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 90,
      render: (v: number) => <span style={{ fontWeight: 600 }}>${v.toFixed(2)}</span>,
    },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 100,
      render: (s: PaymentStatus) => <Tag color={PAYMENT_COLORS[s] ?? 'default'}>{s.toUpperCase()}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: OrderStatus) => <Tag color={STATUS_COLORS[s]}>{s.toUpperCase()}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => <Text style={{ fontSize: 12, color: '#6B7280' }}>{new Date(v).toLocaleString()}</Text>,
    },
  ];

  return (
    <div>
      <div style={styles.pageHeader}>
        <Space>
          <UserOutlined style={{ fontSize: 22, color: '#660033' }} />
          <Title level={3} style={{ margin: 0 }}>Customers</Title>
          <Badge count={total} color="#660033" />
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12}>
          <Card style={styles.statCard}>
            <Statistic
              title="Total Customers"
              value={total}
              prefix={<TeamOutlined style={{ color: '#660033' }} />}
              valueStyle={{ color: '#660033' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card style={styles.statCard}>
            <Statistic
              title="Lifetime Spend (this page)"
              value={revenueOnPage}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#10B981' }} />}
              valueStyle={{ color: '#10B981' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={styles.card}>
        <div style={styles.filters}>
          <Search
            placeholder="Search by name, email, or phone..."
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 320 }}
            onSearch={handleSearch}
            onChange={(e) => { if (!e.target.value) handleSearch(''); }}
          />
        </div>

        <Table
          rowKey="_id"
          dataSource={customers}
          columns={columns}
          loading={loading}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showTotal: (t) => `${t} customers`,
            onChange: (p) => { setPage(p); load(p, search); },
          }}
        />
      </Card>

      <Drawer
        title="Customer Profile"
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        width={640}
        loading={profileLoading}
      >
        {profile && (
          <div>
            <Descriptions column={1} size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Name">{profile.user.name}</Descriptions.Item>
              <Descriptions.Item label="Email">{profile.user.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{profile.user.phone}</Descriptions.Item>
              <Descriptions.Item label="Joined">
                {new Date(profile.user.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Row gutter={12} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card size="small" style={styles.statCard}>
                  <Statistic title="Orders" value={profile.stats.totalOrders} prefix={<ShoppingOutlined style={{ color: '#660033' }} />} valueStyle={{ fontSize: 18, color: '#660033' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={styles.statCard}>
                  <Statistic title="Lifetime Spend" value={profile.stats.totalSpent} precision={2} prefix="$" valueStyle={{ fontSize: 18, color: '#10B981' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={styles.statCard}>
                  <Statistic title="Points" value={profile.stats.pointsBalance} prefix={<TrophyOutlined style={{ color: '#E60073' }} />} valueStyle={{ fontSize: 18, color: '#E60073' }} />
                </Card>
              </Col>
            </Row>

            {profile.badges.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Badges ({profile.badges.length})
                </Text>
                <Space wrap>
                  {profile.badges.map((b) => (
                    <Tag key={b.badge._id} color="gold" style={{ padding: '4px 10px' }}>
                      {b.badge.icon} {b.badge.name}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Order History ({profile.orders.length})
            </Text>
            {profile.orders.length > 0 ? (
              <Table
                rowKey="_id"
                dataSource={profile.orders}
                columns={orderColumns}
                size="small"
                pagination={{ pageSize: 5, hideOnSinglePage: true }}
              />
            ) : (
              <Empty description="No orders yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        )}
      </Drawer>
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
  statCard: {
    borderRadius: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  card: {
    borderRadius: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  filters: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
  },
};
