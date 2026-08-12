import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Typography,
  Popconfirm,
  message,
  Card,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TagsOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Category } from '../types/product';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../api/categoryApi';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;

export default function CategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<{ name: string }>();

  async function load() {
    setLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch {
      message.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingCategory(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat);
    form.setFieldsValue({ name: cat.name });
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!token) return;
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(token, editingCategory._id, values.name);
        message.success('Category updated');
      } else {
        await createCategory(token, values.name);
        message.success('Category created');
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    try {
      await deleteCategory(token, id);
      message.success('Category deleted');
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Delete failed');
    }
  }

  const columns: ColumnsType<Category> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleDateString(),
      width: 160,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: Category) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this category?"
            description="This will fail if any products still reference this category — reassign or remove them first."
            onConfirm={() => handleDelete(record._id)}
            okText="Delete"
            okType="danger"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={styles.pageHeader}>
        <Space>
          <TagsOutlined style={{ fontSize: 22, color: '#660033' }} />
          <Title level={3} style={{ margin: 0 }}>Categories</Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          New Category
        </Button>
      </div>

      <Card style={styles.card}>
        <Table
          rowKey="_id"
          dataSource={categories}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (t) => `${t} categories` }}
        />
      </Card>

      <Modal
        title={editingCategory ? 'Edit Category' : 'New Category'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editingCategory ? 'Save' : 'Create'}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Category Name"
            rules={[
              { required: true, message: 'Name is required' },
              { max: 80, message: 'Max 80 characters' },
            ]}
          >
            <Input placeholder="e.g. Evening Gowns" autoFocus />
          </Form.Item>
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
