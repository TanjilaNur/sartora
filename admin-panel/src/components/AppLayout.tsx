import { Layout, Menu, Typography, Avatar, Dropdown, Space, Switch, Tooltip, theme as antdTheme } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  TagsOutlined,
  OrderedListOutlined,
  LogoutOutlined,
  UserOutlined,
  ShopOutlined,
  CreditCardOutlined,
  RollbackOutlined,
  StarOutlined,
  GiftOutlined,
  TeamOutlined,
  TrophyOutlined,
  CustomerServiceOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { brandPrimary } from '../constants/brandColors';
import type { MenuProps } from 'antd';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/products', icon: <ShoppingOutlined />, label: 'Products' },
  { key: '/categories', icon: <TagsOutlined />, label: 'Categories' },
  { key: '/orders', icon: <OrderedListOutlined />, label: 'Orders' },
  { key: '/customers', icon: <UserOutlined />, label: 'Customers' },
  { key: '/payments', icon: <CreditCardOutlined />, label: 'Payments' },
  { key: '/refunds', icon: <RollbackOutlined />, label: 'Refunds' },
  { key: '/reviews', icon: <StarOutlined />, label: 'Reviews' },
  { key: '/promotions', icon: <GiftOutlined />, label: 'Promotions' },
  { key: '/guests', icon: <TeamOutlined />, label: 'Guest Sessions' },
  { key: '/points', icon: <TrophyOutlined />, label: 'Points & Badges' },
  { key: '/contact-faq', icon: <CustomerServiceOutlined />, label: 'Contact & FAQ' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { token } = antdTheme.useToken();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      danger: true,
      onClick: handleLogout,
    },
  ];

  const selectedKey = menuItems.find((item) => location.pathname.startsWith(item.key))?.key ?? '/dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        theme={isDark ? 'dark' : 'light'}
        style={{
          background: token.colorBgContainer,
          borderRight: isDark ? '1px solid #303030' : '1px solid #E5E7EB',
          boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ ...styles.brand, borderBottom: isDark ? '1px solid #303030' : '1px solid rgba(0,0,0,0.06)' }}>
          <ShopOutlined style={{ fontSize: 24, color: brandPrimary }} />
          <Text strong style={{ fontSize: 16, marginLeft: 10 }}>
            Sartora
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none', fontSize: 14 }}
        />
      </Sider>
      <Layout>
        <Header style={{ ...styles.header, background: token.colorBgContainer, borderBottom: isDark ? '1px solid #303030' : '1px solid #E5E7EB' }}>
          <div />
          <Space size="middle">
            <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <Space size="small">
                <BulbOutlined style={{ fontSize: 16 }} />
                <Switch
                  checked={isDark}
                  onChange={toggleTheme}
                  size="small"
                  checkedChildren="Dark"
                  unCheckedChildren="Light"
                />
              </Space>
            </Tooltip>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ background: brandPrimary }} />
                <Text>{user?.name}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  brand: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px 24px 16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: 56,
    lineHeight: '56px',
  },
  content: {
    padding: 24,
    minHeight: 'calc(100vh - 56px)',
  },
};
