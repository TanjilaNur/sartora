import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Input,
  Space,
  Typography,
  message,
  Card,
  Tag,
  Popconfirm,
} from 'antd';
import { CheckOutlined, CloseOutlined, RollbackOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { RefundRequest, RefundStatus } from '../types/refund';
import { fetchAllRefunds, approveRefund, rejectRefund } from '../api/refundApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const STATUS_COLOR: Record<RefundStatus, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
};

function orderId(r: RefundRequest): string {
  if (typeof r.order === 'string') return r.order;
  return r.order._id;
}

function orderTotal(r: RefundRequest): string {
  if (typeof r.order === 'string') return '—';
  return `$${r.order.total.toFixed(2)}`;
}

function customerName(r: RefundRequest): string {
  if (typeof r.user === 'string') return r.user;
  return r.user.name || r.user.email;
}

function customerEmail(r: RefundRequest): string {
  if (typeof r.user === 'string') return '';
  return r.user.email;
}

export default function RefundsPage() {
  const { token } = useAuth();
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchAllRefunds(token);
      setRefunds(data);
    } catch {
      message.error('Failed to load refund requests');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(refundId: string) {
    if (!token) return;
    setActing(true);
    try {
      const updated = await approveRefund(token, refundId);
      message.success('Refund request approved');
      setRefunds((prev) => prev.map((r) => (r._id === updated._id ? { ...r, status: 'approved' } : r)));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to approve';
      message.error(msg);
    } finally {
      setActing(false);
    }
  }

  function openRejectModal(refund: RefundRequest) {
    setSelectedRefund(refund);
    setAdminNote('');
    setRejectOpen(true);
  }

  async function handleReject() {
    if (!token || !selectedRefund) return;
    setActing(true);
    try {
      const updated = await rejectRefund(token, selectedRefund._id, adminNote.trim() || undefined);
      message.success('Refund request rejected');
      setRefunds((prev) => prev.map((r) => (r._id === updated._id ? { ...r, status: 'rejected', adminNote: updated.adminNote } : r)));
      setRejectOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to reject';
      message.error(msg);
    } finally {
      setActing(false);
    }
  }

  const columns: ColumnsType<RefundRequest> = [
    {
      title: 'Order ID',
      key: 'order',
      width: 130,
      render: (_: unknown, r: RefundRequest) => (
        <Text code style={{ fontSize: 12 }}>{orderId(r).slice(-8).toUpperCase()}</Text>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: unknown, r: RefundRequest) => (
        <div>
          <div style={{ fontWeight: 500, color: '#111827' }}>{customerName(r)}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{customerEmail(r)}</div>
        </div>
      ),
    },
    {
      title: 'Order Total',
      key: 'total',
      width: 110,
      render: (_: unknown, r: RefundRequest) => (
        <span style={{ fontWeight: 600, color: '#111827' }}>{orderTotal(r)}</span>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: RefundStatus) => (
        <Tag color={STATUS_COLOR[s]}>{s.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Admin Note',
      dataIndex: 'adminNote',
      key: 'adminNote',
      ellipsis: true,
      render: (note?: string) => note ? <Text type="secondary">{note}</Text> : '—',
    },
    {
      title: 'Requested',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_: unknown, r: RefundRequest) =>
        r.status === 'pending' ? (
          <Space>
            <Popconfirm
              title="Approve this refund request?"
              okText="Approve"
              okButtonProps={{ style: { background: '#10B981', borderColor: '#10B981' } }}
              onConfirm={() => handleApprove(r._id)}
            >
              <Button
                size="small"
                icon={<CheckOutlined />}
                style={{ color: '#10B981', borderColor: '#10B981' }}
                loading={acting}
              >
                Approve
              </Button>
            </Popconfirm>
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => openRejectModal(r)}
              loading={acting}
            >
              Reject
            </Button>
          </Space>
        ) : (
          <Tag color={STATUS_COLOR[r.status]}>{r.status.toUpperCase()}</Tag>
        ),
    },
  ];

  return (
    <div>
      <div style={styles.pageHeader}>
        <Space>
          <RollbackOutlined style={{ fontSize: 22, color: '#660033' }} />
          <Title level={3} style={{ margin: 0 }}>Refund Requests</Title>
        </Space>
      </div>

      <Card style={styles.card}>
        <Table
          rowKey="_id"
          dataSource={refunds}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 15, showTotal: (t) => `${t} requests` }}
        />
      </Card>

      <Modal
        title="Reject Refund Request"
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={handleReject}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true, loading: acting }}
        destroyOnClose
      >
        <p style={{ color: '#4B5563', marginBottom: 12 }}>
          Optionally add an admin note to explain the rejection to the customer.
        </p>
        <TextArea
          rows={3}
          placeholder="Admin note (optional)"
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
        />
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
