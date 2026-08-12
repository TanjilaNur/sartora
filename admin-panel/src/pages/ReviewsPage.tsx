import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  message,
  Card,
  Tag,
  Rate,
  Popconfirm,
  Badge,
} from 'antd';
import { StarOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Review } from '../types/review';
import { fetchReportedReviews, deleteReview } from '../api/reviewApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

function userName(r: Review): string {
  if (!r.user) return 'Deleted user';
  if (typeof r.user === 'string') return r.user;
  return r.user.name || r.user.email;
}

function userEmail(r: Review): string {
  if (!r.user || typeof r.user === 'string') return '';
  return r.user.email;
}

function productName(r: Review): string {
  if (!r.product) return 'Deleted product';
  if (typeof r.product === 'string') return r.product;
  return r.product.name;
}

export default function ReviewsPage() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchReportedReviews(token);
      setReviews(data);
    } catch {
      message.error('Failed to load reported reviews');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(reviewId: string) {
    if (!token) return;
    setDeleting(reviewId);
    try {
      await deleteReview(token, reviewId);
      message.success('Review deleted');
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete review';
      message.error(msg);
    } finally {
      setDeleting(null);
    }
  }

  const columns: ColumnsType<Review> = [
    {
      title: 'Product',
      key: 'product',
      render: (_: unknown, r: Review) => (
        <Text strong style={{ color: '#111827' }}>{productName(r)}</Text>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: unknown, r: Review) => (
        <div>
          <div style={{ fontWeight: 500, color: '#111827' }}>{userName(r)}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{userEmail(r)}</div>
        </div>
      ),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      width: 160,
      render: (v: number) => <Rate disabled value={v} style={{ fontSize: 14 }} />,
    },
    {
      title: 'Review',
      dataIndex: 'text',
      key: 'text',
      ellipsis: true,
      render: (t: string) => t || <Text type="secondary">—</Text>,
    },
    {
      title: 'Verified',
      dataIndex: 'verified',
      key: 'verified',
      width: 90,
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      render: (_: unknown, r: Review) => (
        <Popconfirm
          title="Delete this review?"
          description="This action cannot be undone."
          okText="Delete"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleDelete(r._id)}
        >
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            loading={deleting === r._id}
          >
            Remove
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={styles.pageHeader}>
        <Space>
          <StarOutlined style={{ fontSize: 22, color: '#660033' }} />
          <Title level={3} style={{ margin: 0 }}>Reported Reviews</Title>
          <Badge count={reviews.length} color="#EF4444" />
        </Space>
        <Button onClick={load} loading={loading}>Refresh</Button>
      </div>

      {reviews.length === 0 && !loading && (
        <Card style={styles.emptyCard}>
          <div style={styles.empty}>
            <WarningOutlined style={{ fontSize: 40, color: '#D1D5DB', marginBottom: 12 }} />
            <Text type="secondary" style={{ fontSize: 16 }}>No reported reviews</Text>
            <Text type="secondary" style={{ fontSize: 13, marginTop: 4 }}>
              Reported reviews from customers will appear here for moderation.
            </Text>
          </div>
        </Card>
      )}

      {(reviews.length > 0 || loading) && (
        <Card style={styles.card}>
          <Table
            rowKey="_id"
            dataSource={reviews}
            columns={columns}
            loading={loading}
            pagination={{ pageSize: 15, showTotal: (t) => `${t} reported reviews` }}
          />
        </Card>
      )}
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
  emptyCard: {
    borderRadius: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    padding: '24px 0',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 0',
  },
};
