import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Alert, Typography, Card, Tabs } from 'antd';
import { LockOutlined, MailOutlined, PhoneOutlined, ShopOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { adminLogin, adminPhoneLogin } from '../api/authApi';
import { brandPrimary } from '../constants/brandColors';

const { Title, Text } = Typography;

interface EmailFormValues {
  email: string;
  password: string;
}

interface PhoneFormValues {
  phone: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(
    (location.state as { error?: string } | null)?.error ?? null
  );
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard';

  async function handleEmailSubmit(values: EmailFormValues) {
    setError(null);
    setLoading(true);
    try {
      const { user, token, refreshToken } = await adminLogin(values.email, values.password);
      if (user.role !== 'admin') {
        setError('Access denied: admin accounts only.');
        return;
      }
      login(user, token, refreshToken);
      console.log(`[auth] admin login: ${user.email}`);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneSubmit(values: PhoneFormValues) {
    setError(null);
    setLoading(true);
    try {
      const { user, token, refreshToken } = await adminPhoneLogin(values.phone, values.password);
      if (user.role !== 'admin') {
        setError('Access denied: admin accounts only.');
        return;
      }
      login(user, token, refreshToken);
      console.log(`[auth] admin phone login: ${values.phone}`);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const tabItems = [
    {
      key: 'email',
      label: 'Email',
      children: (
        <Form
          layout="vertical"
          onFinish={handleEmailSubmit}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#9CA3AF' }} />}
              placeholder="admin@example.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
              placeholder="••••••••"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button type="primary" htmlType="submit" size="large" loading={loading} block>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      children: (
        <Form
          layout="vertical"
          onFinish={handlePhoneSubmit}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              { required: true, message: 'Phone number is required' },
              {
                pattern: /^\+?[0-9\s\-()]{7,20}$/,
                message: 'Enter a valid phone number',
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined style={{ color: '#9CA3AF' }} />}
              placeholder="+1 555 000 0000"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
              placeholder="••••••••"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button type="primary" htmlType="submit" size="large" loading={loading} block>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div style={styles.page}>
      <Card style={styles.card} styles={{ body: { padding: 40 } }}>
        <div style={styles.header}>
          <ShopOutlined style={styles.logo} />
          <Title level={3} style={styles.title}>Sartora Admin</Title>
          <Text type="secondary">Sign in to manage your store</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 24 }}
          />
        )}

        <Tabs
          defaultActiveKey="email"
          items={tabItems}
          onChange={() => setError(null)}
          style={{ marginTop: -8 }}
        />
      </Card>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F3F4F6',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 12,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    color: brandPrimary,
  },
  title: {
    marginTop: 12,
    marginBottom: 4,
    color: '#111827',
  },
};
