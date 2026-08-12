import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  message,
  Card,
  Tag,
  Popconfirm,
  Badge,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  UserOutlined,
  DeleteOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { GuestSession } from '../api/guestApi';
import { fetchGuestSessions, removeGuestSession } from '../api/guestApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export default function GuestPage() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<GuestSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Guards against the pagination race below: only the response matching
  // the most recently issued request is ever applied, so a slower older
  // page's response can't overwrite a newer one that already resolved.
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (p = page) => {
      if (!token) return;
      const requestId = ++requestIdRef.current;
      setLoading(true);
      try {
        const data = await fetchGuestSessions(token, p, limit);
        if (requestId !== requestIdRef.current) return;
        setSessions(data.sessions);
        setTotal(data.total);
      } catch {
        if (requestId === requestIdRef.current) message.error('Failed to load guest sessions');
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [token, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(guestId: string) {
    if (!token) return;
    setDeleting(guestId);
    try {
      await removeGuestSession(token, guestId);
      message.success('Guest session deleted');
      setSessions((prev) => prev.filter((s) => s.guestId !== guestId));
      setTotal((t) => t - 1);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to delete guest session';
      message.error(msg);
    } finally {
      setDeleting(null);
    }
  }

  const activeSessions = sessions.filter((s) => new Date(s.expiresAt) > new Date()).length;
  const totalItems = sessions.reduce((sum, s) => sum + s.itemCount, 0);

  const columns: ColumnsType<GuestSession> = [
    {
      title: 'Guest ID',
      dataIndex: 'guestId',
      key: 'guestId',
      ellipsis: true,
      render: (id: string) => (
        <Text code style={{ fontSize: 12, color: '#4B5563' }}>
          {id}
        </Text>
      ),
    },
    {
      title: 'Cart Items',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 110,
      align: 'center',
      render: (count: number) => (
        <Badge
          count={count}
          showZero
          color={count > 0 ? '#660033' : '#D1D5DB'}
          style={{ fontWeight: 500 }}
        />
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      align: 'center',
      render: (_: unknown, r: GuestSession) => {
        const expired = new Date(r.expiresAt) <= new Date();
        return <Tag color={expired ? 'red' : 'green'}>{expired ? 'Expired' : 'Active'}</Tag>;
      },
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 160,
      render: (v: string) => {
        const d = new Date(v);
        const expired = d <= new Date();
        return (
          <Text style={{ color: expired ? '#EF4444' : '#4B5563', fontSize: 13 }}>
            {d.toLocaleString()}
          </Text>
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (v: string) => (
        <Text style={{ color: '#6B7280', fontSize: 13 }}>{new Date(v).toLocaleString()}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      render: (_: unknown, r: GuestSession) => (
        <Popconfirm
          title="Delete this guest session?"
          description="The guest cart will be permanently removed."
          okText="Delete"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleDelete(r.guestId)}
        >
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            loading={deleting === r.guestId}
          >
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={styles.pageHeader}>
        <Space>
          <UserOutlined style={{ fontSize: 22, color: '#660033' }} />
          <Title level={3} style={{ margin: 0 }}>
            Guest Sessions
          </Title>
          <Badge count={total} color="#660033" />
        </Space>
        <Button onClick={() => load(page)} loading={loading}>
          Refresh
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card style={styles.statCard}>
            <Statistic
              title="Total Sessions"
              value={total}
              prefix={<TeamOutlined style={{ color: '#660033' }} />}
              valueStyle={{ color: '#660033' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={styles.statCard}>
            <Statistic
              title="Active (this page)"
              value={activeSessions}
              prefix={<ClockCircleOutlined style={{ color: '#10B981' }} />}
              valueStyle={{ color: '#10B981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={styles.statCard}>
            <Statistic
              title="Items in Carts (this page)"
              value={totalItems}
              prefix={<ShoppingCartOutlined style={{ color: '#E60073' }} />}
              valueStyle={{ color: '#E60073' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={styles.card}>
        <Table
          rowKey="guestId"
          dataSource={sessions}
          columns={columns}
          loading={loading}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showTotal: (t) => `${t} guest sessions`,
            onChange: (p) => setPage(p),
          }}
          locale={{
            emptyText: (
              <div style={styles.empty}>
                <UserOutlined style={{ fontSize: 40, color: '#D1D5DB', marginBottom: 12 }} />
                <Text type="secondary" style={{ fontSize: 16 }}>
                  No guest sessions
                </Text>
                <Text type="secondary" style={{ fontSize: 13, marginTop: 4 }}>
                  Guest shopping sessions will appear here when users browse without signing in.
                </Text>
              </div>
            ),
          }}
        />
      </Card>
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
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 0',
  },
};
