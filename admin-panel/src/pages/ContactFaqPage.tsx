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
  Tabs,
  Tooltip,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  EyeOutlined,
  SendOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Contact } from '../types/contact';
import type { FAQ, CreateFAQPayload } from '../types/faq';
import {
  fetchContacts,
  replyToContact,
  updateContactStatus,
  deleteContact,
} from '../api/contactApi';
import {
  fetchAllFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
} from '../api/faqApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const STATUS_COLORS: Record<string, string> = {
  open: 'gold',
  resolved: 'green',
  closed: 'default',
};

type FAQFormValues = {
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;
};

export default function ContactFaqPage() {
  const { token } = useAuth();

  // --- Contact state ---
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [contactPage, setContactPage] = useState(1);
  const [contactTotal, setContactTotal] = useState(0);
  const CONTACT_PAGE_SIZE = 20;
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  const [replyModal, setReplyModal] = useState<Contact | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySaving, setReplySaving] = useState(false);
  const [deletingContact, setDeletingContact] = useState<string | null>(null);

  // --- FAQ state ---
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqModal, setFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqSaving, setFaqSaving] = useState(false);
  const [deletingFaq, setDeletingFaq] = useState<string | null>(null);
  const [faqForm] = Form.useForm<FAQFormValues>();

  // --- Load contacts ---
  const loadContacts = useCallback(async (page = contactPage) => {
    if (!token) return;
    setContactLoading(true);
    try {
      const result = await fetchContacts(token, statusFilter, page, CONTACT_PAGE_SIZE);
      setContacts(result.contacts);
      setContactTotal(result.total);
    } catch {
      message.error('Failed to load contact messages');
    } finally {
      setContactLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter]);

  useEffect(() => { loadContacts(1); setContactPage(1); }, [token, statusFilter]);

  // --- Load FAQs ---
  const loadFaqs = useCallback(async () => {
    if (!token) return;
    setFaqLoading(true);
    try {
      const data = await fetchAllFAQs(token);
      setFaqs(data);
    } catch {
      message.error('Failed to load FAQs');
    } finally {
      setFaqLoading(false);
    }
  }, [token]);

  useEffect(() => { loadFaqs(); }, [loadFaqs]);

  // --- Contact handlers ---
  async function handleReply() {
    if (!token || !replyModal) return;
    if (!replyText.trim()) { message.warning('Reply cannot be empty'); return; }
    setReplySaving(true);
    try {
      const updated = await replyToContact(token, replyModal._id, replyText.trim());
      setContacts((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      message.success('Reply sent');
      setReplyModal(null);
      setReplyText('');
    } catch {
      message.error('Failed to send reply');
    } finally {
      setReplySaving(false);
    }
  }

  async function handleStatusChange(contactId: string, status: 'open' | 'resolved' | 'closed') {
    if (!token) return;
    try {
      const updated = await updateContactStatus(token, contactId, status);
      setContacts((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      message.success('Status updated');
    } catch {
      message.error('Failed to update status');
    }
  }

  async function handleDeleteContact(contactId: string) {
    if (!token) return;
    setDeletingContact(contactId);
    try {
      await deleteContact(token, contactId);
      setContacts((prev) => prev.filter((c) => c._id !== contactId));
      message.success('Contact deleted');
    } catch {
      message.error('Failed to delete contact');
    } finally {
      setDeletingContact(null);
    }
  }

  // --- FAQ handlers ---
  function openCreateFaq() {
    setEditingFaq(null);
    faqForm.resetFields();
    faqForm.setFieldsValue({ category: 'General', order: 0, active: true });
    setFaqModal(true);
  }

  function openEditFaq(faq: FAQ) {
    setEditingFaq(faq);
    faqForm.setFieldsValue({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      active: faq.active,
    });
    setFaqModal(true);
  }

  async function handleFaqSubmit(values: FAQFormValues) {
    if (!token) return;
    setFaqSaving(true);
    try {
      if (editingFaq) {
        const updated = await updateFAQ(token, editingFaq._id, values);
        setFaqs((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
        message.success('FAQ updated');
      } else {
        const payload: CreateFAQPayload = {
          question: values.question,
          answer: values.answer,
          category: values.category,
          order: values.order,
        };
        const created = await createFAQ(token, payload);
        setFaqs((prev) => [...prev, created]);
        message.success('FAQ created');
      }
      setFaqModal(false);
    } catch {
      message.error('Failed to save FAQ');
    } finally {
      setFaqSaving(false);
    }
  }

  async function handleDeleteFaq(faqId: string) {
    if (!token) return;
    setDeletingFaq(faqId);
    try {
      await deleteFAQ(token, faqId);
      setFaqs((prev) => prev.filter((f) => f._id !== faqId));
      message.success('FAQ deleted');
    } catch {
      message.error('Failed to delete FAQ');
    } finally {
      setDeletingFaq(null);
    }
  }

  // --- Contact columns ---
  const contactColumns: ColumnsType<Contact> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 140,
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      ellipsis: true,
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: 'open' | 'resolved' | 'closed', record) => (
        <Select<'open' | 'resolved' | 'closed'>
          size="small"
          value={status}
          onChange={(val) => handleStatusChange(record._id, val)}
          style={{ width: 110 }}
          options={[
            { value: 'open', label: <Tag color="gold">Open</Tag> },
            { value: 'resolved', label: <Tag color="green">Resolved</Tag> },
            { value: 'closed', label: <Tag>Closed</Tag> },
          ]}
        />
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (v) => dayjs(v).format('MMM D, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setViewContact(record)}
            />
          </Tooltip>
          <Tooltip title="Reply">
            <Button
              size="small"
              icon={<SendOutlined />}
              type="primary"
              ghost
              onClick={() => { setReplyModal(record); setReplyText(record.reply || ''); }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this contact?"
            onConfirm={() => handleDeleteContact(record._id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deletingContact === record._id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // --- FAQ columns ---
  const faqColumns: ColumnsType<FAQ> = [
    {
      title: '#',
      dataIndex: 'order',
      key: 'order',
      width: 60,
      sorter: (a, b) => a.order - b.order,
    },
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
      ellipsis: true,
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (v) => <Tag color="purple">{v}</Tag>,
    },
    {
      title: 'Active',
      dataIndex: 'active',
      key: 'active',
      width: 80,
      render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditFaq(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this FAQ?"
            onConfirm={() => handleDeleteFaq(record._id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deletingFaq === record._id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'contacts',
      label: (
        <Space>
          <MessageOutlined />
          Contact Messages
        </Space>
      ),
      children: (
        <Card
          bordered={false}
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0, color: '#111827' }}>
              Contact Submissions
            </Title>
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: 160 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
          </div>
          <Table
            columns={contactColumns}
            dataSource={contacts}
            rowKey="_id"
            loading={contactLoading}
            pagination={{
              current: contactPage,
              pageSize: CONTACT_PAGE_SIZE,
              total: contactTotal,
              showSizeChanger: false,
              onChange: (p) => { setContactPage(p); loadContacts(p); },
            }}
            size="small"
          />
        </Card>
      ),
    },
    {
      key: 'faqs',
      label: (
        <Space>
          <QuestionCircleOutlined />
          FAQ Management
        </Space>
      ),
      children: (
        <Card
          bordered={false}
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0, color: '#111827' }}>
              Frequently Asked Questions
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateFaq}
              style={{ background: '#660033', borderColor: '#660033' }}
            >
              Add FAQ
            </Button>
          </div>
          <Table
            columns={faqColumns}
            dataSource={faqs}
            rowKey="_id"
            loading={faqLoading}
            pagination={{ pageSize: 15, showSizeChanger: false }}
            size="small"
            expandable={{
              expandedRowRender: (record) => (
                <Paragraph style={{ margin: '8px 0', color: '#4B5563', fontSize: 14 }}>
                  {record.answer}
                </Paragraph>
              ),
            }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: '#111827' }}>
        Contact & FAQ
      </Title>

      <Tabs items={tabItems} defaultActiveKey="contacts" />

      {/* View Contact Modal */}
      <Modal
        title="Contact Details"
        open={!!viewContact}
        onCancel={() => setViewContact(null)}
        footer={[
          <Button key="close" onClick={() => setViewContact(null)}>Close</Button>,
          <Button
            key="reply"
            type="primary"
            icon={<SendOutlined />}
            style={{ background: '#660033', borderColor: '#660033' }}
            onClick={() => {
              if (viewContact) {
                setReplyModal(viewContact);
                setReplyText(viewContact.reply || '');
                setViewContact(null);
              }
            }}
          >
            Reply
          </Button>,
        ]}
        width={600}
      >
        {viewContact && (
          <Descriptions column={1} bordered size="small" style={{ marginTop: 8 }}>
            <Descriptions.Item label="Name">{viewContact.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{viewContact.email}</Descriptions.Item>
            <Descriptions.Item label="Subject">{viewContact.subject}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={STATUS_COLORS[viewContact.status]}>{viewContact.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Date">
              {dayjs(viewContact.createdAt).format('MMM D, YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Message">
              <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{viewContact.message}</Paragraph>
            </Descriptions.Item>
            {viewContact.reply && (
              <Descriptions.Item label="Reply">
                <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#660033' }}>
                  {viewContact.reply}
                </Paragraph>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Reply Modal */}
      <Modal
        title="Reply to Contact"
        open={!!replyModal}
        onCancel={() => { setReplyModal(null); setReplyText(''); }}
        onOk={handleReply}
        okText="Send Reply"
        okButtonProps={{ loading: replySaving, style: { background: '#660033', borderColor: '#660033' } }}
        width={520}
      >
        {replyModal && (
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
              Replying to <strong>{replyModal.name}</strong> ({replyModal.email}) — {replyModal.subject}
            </Text>
            <TextArea
              rows={5}
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
          </div>
        )}
      </Modal>

      {/* FAQ Modal */}
      <Modal
        title={editingFaq ? 'Edit FAQ' : 'Add FAQ'}
        open={faqModal}
        onCancel={() => setFaqModal(false)}
        onOk={() => faqForm.submit()}
        okText={editingFaq ? 'Update' : 'Create'}
        okButtonProps={{ loading: faqSaving, style: { background: '#660033', borderColor: '#660033' } }}
        width={560}
        destroyOnHidden
      >
        <Form
          form={faqForm}
          layout="vertical"
          onFinish={handleFaqSubmit}
          style={{ marginTop: 8 }}
        >
          <Form.Item
            name="question"
            label="Question"
            rules={[{ required: true, message: 'Question is required' }]}
          >
            <Input placeholder="Enter the question" />
          </Form.Item>
          <Form.Item
            name="answer"
            label="Answer"
            rules={[{ required: true, message: 'Answer is required' }]}
          >
            <TextArea rows={4} placeholder="Enter the answer" />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Input placeholder="e.g. Shipping, Returns, Payment" />
          </Form.Item>
          <Form.Item name="order" label="Display Order">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          {editingFaq && (
            <Form.Item name="active" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
