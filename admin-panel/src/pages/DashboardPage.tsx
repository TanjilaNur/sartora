import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Select,
  Table,
  Tag,
  Skeleton,
  Alert,
  DatePicker,
  Button,
  Space,
} from 'antd';
import {
  ShoppingOutlined,
  OrderedListOutlined,
  TeamOutlined,
  WarningOutlined,
  RiseOutlined,
  PieChartOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import type { DashboardData, RecentOrder, OrderStatusCount } from '../types/analytics';
import { fetchDashboard, type DashboardDateRange } from '../api/analyticsApi';
import { useAuth } from '../context/AuthContext';
import RevenueTrendChart from '../components/RevenueTrendChart';
import OrderStatusBarChart from '../components/OrderStatusBarChart';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const STATUS_COLORS: Record<OrderStatusCount['status'], string> = {
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

function orderCustomerName(user: RecentOrder['user']): string {
  if (!user) return 'Deleted user';
  if (typeof user === 'string') return user;
  return user.name || user.email;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [days, setDays] = useState(30);

  // pendingRange is just what's selected in the calendar; the dashboard
  // keeps showing its default view until Submit commits it to appliedRange.
  const [pendingRange, setPendingRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [appliedRange, setAppliedRange] = useState<DashboardDateRange | null>(null);

  const load = useCallback(async (d = days, range = appliedRange) => {
    if (!token) return;
    setLoading(true);
    setError(false);
    try {
      const result = await fetchDashboard(token, d, range ?? undefined);
      setData(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { load(days, appliedRange); }, [days, appliedRange]);

  function handleApplyRange() {
    if (!pendingRange) return;
    setAppliedRange({
      startDate: pendingRange[0].format('YYYY-MM-DD'),
      endDate: pendingRange[1].format('YYYY-MM-DD'),
    });
  }

  function handleResetRange() {
    setPendingRange(null);
    setAppliedRange(null);
  }

  const recentOrdersColumns: ColumnsType<RecentOrder> = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: '_id',
      width: 110,
      render: (id: string) => <Text code style={{ fontSize: 12 }}>{id.slice(-8).toUpperCase()}</Text>,
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: unknown, r: RecentOrder) => orderCustomerName(r.user),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      render: (v: number) => <strong>${v.toFixed(2)}</strong>,
    },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 100,
      render: (s: string) => <Tag color={PAYMENT_COLORS[s] ?? 'default'}>{s.toUpperCase()}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: OrderStatusCount['status']) => <Tag color={STATUS_COLORS[s]}>{s.toUpperCase()}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
  ];

  const stats = data?.stats;
  const revenuePeriodTotal = data?.revenueTrend.reduce((sum, p) => sum + p.revenue, 0) ?? 0;

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Dashboard</Title>
          <Text type="secondary">Welcome back, {user?.name}</Text>
        </div>

        <Space direction="vertical" align="end" size={4}>
          <Space>
            <RangePicker
              value={pendingRange}
              onChange={(v) => setPendingRange(v && v[0] && v[1] ? [v[0], v[1]] : null)}
              disabledDate={(d) => d.isAfter(dayjs().endOf('day'))}
              allowClear
            />
            <Button type="primary" onClick={handleApplyRange} disabled={!pendingRange}>
              Submit
            </Button>
            {appliedRange && <Button onClick={handleResetRange}>Reset</Button>}
          </Space>
          {appliedRange && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              Showing {dayjs(appliedRange.startDate).format('MMM D, YYYY')} – {dayjs(appliedRange.endDate).format('MMM D, YYYY')}
            </Text>
          )}
        </Space>
      </div>

      {error && (
        <Alert
          type="error"
          message="Failed to load dashboard data"
          action={<a onClick={() => load()}>Retry</a>}
          style={{ marginBottom: 20 }}
          showIcon
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={5}>
          <Card style={styles.statCard} hoverable onClick={() => navigate('/payments')}>
            <Skeleton active loading={loading && !data} paragraph={false}>
              <Statistic
                title="Total Revenue"
                value={stats?.totalRevenue ?? 0}
                precision={2}
                prefix={<RiseOutlined style={{ color: '#660033' }} />}
                formatter={(v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>All-time, paid orders</Text>
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card style={styles.statCard} hoverable onClick={() => navigate('/orders')}>
            <Skeleton active loading={loading && !data} paragraph={false}>
              <Statistic
                title="Total Orders"
                value={stats?.totalOrders ?? 0}
                prefix={<OrderedListOutlined style={{ color: '#10B981' }} />}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>Manage from the Orders page</Text>
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card style={styles.statCard} hoverable onClick={() => navigate('/guests')}>
            <Skeleton active loading={loading && !data} paragraph={false}>
              <Statistic
                title="Total Customers"
                value={stats?.totalCustomers ?? 0}
                prefix={<TeamOutlined style={{ color: '#3B82F6' }} />}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>Registered accounts</Text>
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card style={styles.statCard} hoverable onClick={() => navigate('/products')}>
            <Skeleton active loading={loading && !data} paragraph={false}>
              <Statistic
                title="Total Products"
                value={stats?.totalProducts ?? 0}
                prefix={<ShoppingOutlined style={{ color: '#E60073' }} />}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>Manage from the Products page</Text>
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card
            style={{ ...styles.statCard, ...(stats && stats.lowStockProducts > 0 ? styles.alertCard : {}) }}
            hoverable
            onClick={() => navigate('/products')}
          >
            <Skeleton active loading={loading && !data} paragraph={false}>
              <Statistic
                title="Low Stock"
                value={stats?.lowStockProducts ?? 0}
                valueStyle={stats && stats.lowStockProducts > 0 ? { color: '#EF4444' } : undefined}
                prefix={<WarningOutlined style={{ color: stats && stats.lowStockProducts > 0 ? '#EF4444' : '#9CA3AF' }} />}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>5 units or fewer</Text>
            </Skeleton>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={16}>
          <Card
            style={styles.card}
            title={
              <span><RiseOutlined style={{ color: '#660033', marginRight: 8 }} />Revenue Trend</span>
            }
            extra={
              <Select
                value={days}
                onChange={setDays}
                size="small"
                style={{ width: 130 }}
                disabled={!!appliedRange}
                title={appliedRange ? 'Reset the date range above to use this instead' : undefined}
                options={[
                  { value: 7, label: 'Last 7 days' },
                  { value: 30, label: 'Last 30 days' },
                  { value: 90, label: 'Last 90 days' },
                ]}
              />
            }
          >
            <Skeleton active loading={loading && !data}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  ${revenuePeriodTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in the selected period
                </Text>
              </div>
              {data && <RevenueTrendChart data={data.revenueTrend} />}
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            style={styles.card}
            title={
              <span><PieChartOutlined style={{ color: '#660033', marginRight: 8 }} />Orders by Status</span>
            }
          >
            <Skeleton active loading={loading && !data}>
              {data && <OrderStatusBarChart data={data.orderStatusBreakdown} />}
            </Skeleton>
          </Card>
        </Col>
      </Row>

      <Card
        style={styles.card}
        title={
          <span><ClockCircleOutlined style={{ color: '#660033', marginRight: 8 }} />Recent Orders</span>
        }
        extra={<a onClick={() => navigate('/orders')}>View all orders</a>}
      >
        <Table
          rowKey="_id"
          dataSource={data?.recentOrders ?? []}
          columns={recentOrdersColumns}
          loading={loading && !data}
          pagination={false}
          size="small"
          onRow={(record) => ({
            style: { cursor: 'pointer' },
            onClick: () => navigate('/orders'),
            title: record._id,
          })}
        />
      </Card>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  statCard: {
    borderRadius: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  alertCard: {
    borderColor: '#FCA5A5',
  },
  card: {
    borderRadius: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
};
