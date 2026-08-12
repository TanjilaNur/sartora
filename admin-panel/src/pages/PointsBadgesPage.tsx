import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
  message,
  Card,
  Tag,
  Popconfirm,
  Tabs,
  Avatar,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TrophyOutlined,
  StarFilled,
  CrownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Badge, CreateBadgePayload, LeaderboardEntry } from '../types/points';
import { fetchBadges, createBadge, updateBadge, deleteBadge, fetchLeaderboard } from '../api/pointsApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const CRITERIA_LABELS: Record<string, string> = {
  points_threshold: 'Points Threshold',
  order_count: 'Order Count',
  review_count: 'Review Count',
};

const CRITERIA_COLORS: Record<string, string> = {
  points_threshold: 'purple',
  order_count: 'blue',
  review_count: 'gold',
};

type FormValues = {
  key: string;
  name: string;
  description: string;
  icon?: string;
  criteriaType: 'points_threshold' | 'order_count' | 'review_count';
  criteriaValue: number;
};

function LeaderboardTab() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchLeaderboard(token, 50);
      setEntries(data.leaderboard);
    } catch {
      message.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function rankBadge(rank: number) {
    if (rank === 1) return <CrownOutlined style={{ color: '#F59E0B', fontSize: 18 }} />;
    if (rank === 2) return <TrophyOutlined style={{ color: '#9CA3AF', fontSize: 16 }} />;
    if (rank === 3) return <TrophyOutlined style={{ color: '#CD7C2F', fontSize: 16 }} />;
    return <Text style={{ color: '#4B5563', fontWeight: 600 }}>#{rank}</Text>;
  }

  const columns: ColumnsType<LeaderboardEntry> = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {rankBadge(rank)}
        </div>
      ),
    },
    {
      title: 'User',
      dataIndex: 'name',
      key: 'name',
      render: (name: string | undefined, record: LeaderboardEntry) => (
        <Space>
          <Avatar
            style={{
              background: record.rank <= 3 ? '#660033' : '#EBDEE4',
              color: record.rank <= 3 ? '#fff' : '#660033',
              fontWeight: 600,
            }}
            size="small"
          >
            {(name ?? 'U')[0].toUpperCase()}
          </Avatar>
          <div>
            <Text strong style={{ display: 'block', fontSize: 13 }}>{name ?? 'Unknown User'}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{record.userId.slice(-8)}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      width: 140,
      render: (pts: number, record: LeaderboardEntry) => (
        <Space>
          <StarFilled style={{ color: '#E60073', fontSize: 14 }} />
          <Text strong style={{ fontSize: 15, color: record.rank === 1 ? '#660033' : '#111827' }}>
            {pts.toLocaleString()}
          </Text>
        </Space>
      ),
    },
  ];

  const top3 = entries.slice(0, 3);

  return (
    <div>
      {top3.length > 0 && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {[1, 0, 2].map((i) => {
            const entry = top3[i];
            if (!entry) return null;
            const colors = ['#9CA3AF', '#F59E0B', '#CD7C2F'];
            const podiumColor = [colors[1], colors[0], colors[2]][i];
            return (
              <Col span={8} key={entry.userId}>
                <Card
                  style={{
                    textAlign: 'center',
                    borderRadius: 10,
                    border: `2px solid ${entry.rank === 1 ? '#660033' : '#E5E7EB'}`,
                    boxShadow: entry.rank === 1 ? '0 4px 20px rgba(124,58,237,0.15)' : '0 1px 3px rgba(0,0,0,0.08)',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 4 }}>
                    {entry.rank === 1 ? '👑' : entry.rank === 2 ? '🥈' : '🥉'}
                  </div>
                  <Avatar
                    size={48}
                    style={{ background: podiumColor, fontWeight: 700, fontSize: 20 }}
                  >
                    {(entry.name ?? 'U')[0].toUpperCase()}
                  </Avatar>
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ display: 'block' }}>{entry.name ?? 'Unknown'}</Text>
                    <Statistic
                      value={entry.points}
                      suffix="pts"
                      valueStyle={{ fontSize: 18, color: '#660033', fontWeight: 700 }}
                    />
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Card style={styles.card}>
        <Table
          rowKey="userId"
          dataSource={entries}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (t) => `${t} users` }}
        />
      </Card>
    </div>
  );
}

function BadgesTab() {
  const { token } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Badge | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form] = Form.useForm<FormValues>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBadges();
      setBadges(data);
    } catch {
      message.error('Failed to load badges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ criteriaType: 'points_threshold', criteriaValue: 100 });
    setModalOpen(true);
  }

  function openEdit(badge: Badge) {
    setEditing(badge);
    form.setFieldsValue({
      key: badge.key,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      criteriaType: badge.criteria.type,
      criteriaValue: badge.criteria.value,
    });
    setModalOpen(true);
  }

  async function handleSubmit() {
    let values: FormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    if (!token) return;
    setSaving(true);
    try {
      if (editing) {
        const payload = {
          name: values.name,
          description: values.description,
          icon: values.icon,
          criteria: { type: values.criteriaType, value: values.criteriaValue },
        };
        const updated = await updateBadge(token, editing._id, payload);
        setBadges((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
        message.success('Badge updated');
      } else {
        const payload: CreateBadgePayload = {
          key: values.key,
          name: values.name,
          description: values.description,
          icon: values.icon,
          criteria: { type: values.criteriaType, value: values.criteriaValue },
        };
        const created = await createBadge(token, payload);
        setBadges((prev) => [...prev, created]);
        message.success('Badge created');
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    setDeleting(id);
    try {
      await deleteBadge(token, id);
      setBadges((prev) => prev.filter((b) => b._id !== id));
      message.success('Badge deleted');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete';
      message.error(msg);
    } finally {
      setDeleting(null);
    }
  }

  const columns: ColumnsType<Badge> = [
    {
      title: 'Icon',
      dataIndex: 'icon',
      key: 'icon',
      width: 60,
      render: (icon: string) => (
        <span style={{ fontSize: 22 }}>{icon || '🏅'}</span>
      ),
    },
    {
      title: 'Name',
      key: 'name',
      render: (_: unknown, b: Badge) => (
        <div>
          <Text strong style={{ display: 'block' }}>{b.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{b.key}</Text>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (d: string) => <Text style={{ color: '#4B5563', fontSize: 13 }}>{d}</Text>,
    },
    {
      title: 'Criteria',
      key: 'criteria',
      width: 200,
      render: (_: unknown, b: Badge) => (
        <Space direction="vertical" size={2}>
          <Tag color={CRITERIA_COLORS[b.criteria.type]}>{CRITERIA_LABELS[b.criteria.type]}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>≥ {b.criteria.value.toLocaleString()}</Text>
        </Space>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      render: (_: unknown, b: Badge) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(b)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete badge?"
            description="Users who earned it will lose it too."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(b._id)}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleting === b._id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          New Badge
        </Button>
      </div>

      <Card style={styles.card}>
        <Table
          rowKey="_id"
          dataSource={badges}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 15, showTotal: (t) => `${t} badges` }}
        />
      </Card>

      <Modal
        title={editing ? 'Edit Badge' : 'New Badge'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editing ? 'Save Changes' : 'Create'}
        okButtonProps={{ loading: saving }}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {!editing && (
            <Form.Item
              name="key"
              label="Badge Key"
              rules={[
                { required: true, message: 'Key is required' },
                { pattern: /^[a-z0-9_]+$/, message: 'Lowercase letters, numbers, underscores only' },
              ]}
            >
              <Input placeholder="e.g. first_purchase" maxLength={50} />
            </Form.Item>
          )}

          <Space style={{ display: 'flex' }} size={16}>
            <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]} style={{ flex: 1 }}>
              <Input placeholder="e.g. First Purchase" maxLength={60} />
            </Form.Item>
            <Form.Item
              name="icon"
              label="Icon (emoji)"
              style={{ width: 100 }}
              rules={[
                {
                  // `maxLength` on the Input counts raw UTF-16 code units and
                  // truncates mid-character for many emoji (flags, ZWJ
                  // sequences). Array.from splits on surrogate pairs
                  // correctly, so this rejects instead of mangling instead.
                  validator: (_, value: string | undefined) => {
                    if (!value || Array.from(value).length <= 8) return Promise.resolve();
                    return Promise.reject(new Error('Icon is too long'));
                  },
                },
              ]}
            >
              <Input placeholder="🏅" />
            </Form.Item>
          </Space>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Description is required' }]}
          >
            <Input.TextArea rows={2} placeholder="Describe what earns this badge" maxLength={200} />
          </Form.Item>

          <Space style={{ display: 'flex' }} size={16}>
            <Form.Item
              name="criteriaType"
              label="Criteria Type"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select
                options={[
                  { value: 'points_threshold', label: 'Points Threshold' },
                  { value: 'order_count', label: 'Order Count' },
                  { value: 'review_count', label: 'Review Count' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="criteriaValue"
              label="Threshold Value"
              rules={[{ required: true, message: 'Value is required' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="e.g. 100" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}

export default function PointsBadgesPage() {
  return (
    <div>
      <div style={styles.pageHeader}>
        <Space>
          <TrophyOutlined style={{ fontSize: 22, color: '#660033' }} />
          <Title level={3} style={{ margin: 0 }}>Points, Badges & Leaderboard</Title>
        </Space>
      </div>

      <Tabs
        defaultActiveKey="leaderboard"
        items={[
          {
            key: 'leaderboard',
            label: (
              <Space>
                <TrophyOutlined />
                Leaderboard
              </Space>
            ),
            children: <LeaderboardTab />,
          },
          {
            key: 'badges',
            label: (
              <Space>
                <StarFilled />
                Badges
              </Space>
            ),
            children: <BadgesTab />,
          },
        ]}
      />
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
};
