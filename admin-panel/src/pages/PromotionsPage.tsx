import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Space,
  Typography,
  message,
  Card,
  Tag,
  Popconfirm,
  DatePicker,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Promotion, CreatePromotionPayload, UpdatePromotionPayload } from '../types/promotion';
import { fetchPromotions, createPromotion, updatePromotion, deletePromotion } from '../api/promotionApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

type FormValues = {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  perUserLimit?: number;
  expiresAt?: dayjs.Dayjs;
  active?: boolean;
};

export default function PromotionsPage() {
  const { token } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form] = Form.useForm<FormValues>();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchPromotions(token);
      setPromotions(data);
    } catch {
      message.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ type: 'percent', active: true, perUserLimit: 1, minOrderAmount: 0 });
    setModalOpen(true);
  }

  function openEdit(promo: Promotion) {
    setEditing(promo);
    form.setFieldsValue({
      code: promo.code,
      type: promo.type,
      value: promo.value,
      minOrderAmount: promo.minOrderAmount,
      maxUses: promo.maxUses,
      perUserLimit: promo.perUserLimit,
      expiresAt: promo.expiresAt ? dayjs(promo.expiresAt) : undefined,
      active: promo.active,
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
        const payload: UpdatePromotionPayload = {
          type: values.type,
          value: values.value,
          minOrderAmount: values.minOrderAmount,
          maxUses: values.maxUses,
          perUserLimit: values.perUserLimit,
          expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined,
          active: values.active,
        };
        const updated = await updatePromotion(token, editing._id, payload);
        setPromotions((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
        message.success('Promotion updated');
      } else {
        const payload: CreatePromotionPayload = {
          code: values.code,
          type: values.type,
          value: values.value,
          minOrderAmount: values.minOrderAmount,
          maxUses: values.maxUses,
          perUserLimit: values.perUserLimit,
          expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined,
        };
        const created = await createPromotion(token, payload);
        setPromotions((prev) => [created, ...prev]);
        message.success('Promotion created');
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    setDeleting(id);
    try {
      await deletePromotion(token, id);
      setPromotions((prev) => prev.filter((p) => p._id !== id));
      message.success('Promotion deleted');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete';
      message.error(msg);
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleActive(promo: Promotion) {
    if (!token) return;
    try {
      const updated = await updatePromotion(token, promo._id, { active: !promo.active });
      setPromotions((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      message.success(`Promotion ${updated.active ? 'activated' : 'deactivated'}`);
    } catch {
      message.error('Failed to update status');
    }
  }

  const columns: ColumnsType<Promotion> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Text code style={{ fontSize: 13, color: '#660033', fontWeight: 600 }}>{code}</Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (t: string) => (
        <Tag color={t === 'percent' ? 'purple' : 'blue'}>{t === 'percent' ? 'Percent' : 'Fixed $'}</Tag>
      ),
    },
    {
      title: 'Discount',
      key: 'discount',
      width: 100,
      render: (_: unknown, p: Promotion) => (
        <span style={{ fontWeight: 600, color: '#10B981' }}>
          {p.type === 'percent' ? `${p.value}%` : `$${p.value.toFixed(2)}`}
        </span>
      ),
    },
    {
      title: 'Min Order',
      dataIndex: 'minOrderAmount',
      key: 'minOrderAmount',
      width: 100,
      render: (v: number) => v > 0 ? `$${v.toFixed(2)}` : '—',
    },
    {
      title: 'Uses',
      key: 'uses',
      width: 100,
      render: (_: unknown, p: Promotion) => (
        <span style={{ color: '#4B5563' }}>
          {p.usedCount} / {p.maxUses ?? '∞'}
        </span>
      ),
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 120,
      render: (v?: string) => {
        if (!v) return <Text type="secondary">Never</Text>;
        const expired = new Date(v) < new Date();
        return (
          <span style={{ color: expired ? '#EF4444' : '#111827' }}>
            {new Date(v).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      title: 'Active',
      dataIndex: 'active',
      key: 'active',
      width: 80,
      render: (v: boolean, record: Promotion) => (
        <Tooltip title={v ? 'Click to deactivate' : 'Click to activate'}>
          <Switch
            size="small"
            checked={v}
            onChange={() => handleToggleActive(record)}
            style={{ backgroundColor: v ? '#10B981' : undefined }}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_: unknown, p: Promotion) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(p)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this promotion?"
            description="This cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(p._id)}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleting === p._id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={styles.pageHeader}>
        <Space>
          <GiftOutlined style={{ fontSize: 22, color: '#660033' }} />
          <Title level={3} style={{ margin: 0 }}>Promotions</Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          New Promotion
        </Button>
      </div>

      <Card style={styles.card}>
        <Table
          rowKey="_id"
          dataSource={promotions}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 15, showTotal: (t) => `${t} promotions` }}
        />
      </Card>

      <Modal
        title={editing ? 'Edit Promotion' : 'New Promotion'}
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
              name="code"
              label="Promo Code"
              rules={[{ required: true, message: 'Promo code is required' }]}
            >
              <Input placeholder="e.g. SAVE20" style={{ textTransform: 'uppercase' }} maxLength={30} />
            </Form.Item>
          )}

          <Space style={{ display: 'flex' }} size={16}>
            <Form.Item
              name="type"
              label="Discount Type"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select options={[{ value: 'percent', label: 'Percent (%)' }, { value: 'fixed', label: 'Fixed Amount ($)' }]} />
            </Form.Item>

            <Form.Item
              name="value"
              label="Discount Value"
              rules={[{ required: true, message: 'Value is required' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} max={100000} style={{ width: '100%' }} placeholder="e.g. 20" />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} size={16}>
            <Form.Item name="minOrderAmount" label="Min Order Amount ($)" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>

            <Form.Item name="perUserLimit" label="Per-User Limit" style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: '100%' }} placeholder="1" />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} size={16}>
            <Form.Item name="maxUses" label="Max Total Uses" style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: '100%' }} placeholder="Unlimited" />
            </Form.Item>

            <Form.Item name="expiresAt" label="Expiry Date" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d < dayjs().startOf('day')} />
            </Form.Item>
          </Space>

          {editing && (
            <Form.Item name="active" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
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
};
