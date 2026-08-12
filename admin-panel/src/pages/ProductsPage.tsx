import { useEffect, useState, useCallback, useRef } from 'react';
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
  Popconfirm,
  message,
  Card,
  Tag,
  Image,
  Badge,
  ColorPicker,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingOutlined,
  SearchOutlined,
  MinusCircleOutlined,
  UploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Product, Category, ProductPayload, ProductVariant } from '../types/product';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  exportProductsCsv,
  importProductsCsv,
} from '../api/productApi';
import { fetchCategories } from '../api/categoryApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Search } = Input;

// Form.Item clones its child and injects value/onChange, so exposing that
// exact contract (rather than ColorPicker's own onChange(color, hex) and
// separate onClear callbacks) is what lets a variant's color round-trip as
// a plain hex string — or undefined once cleared — through the form.
function VariantColorInput({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value?: string) => void;
}) {
  return (
    <ColorPicker
      value={value ?? null}
      // The onChange(color, css) "css" argument isn't reliably hex-formatted
      // (it came back as "rgb(37,99,235)" in testing, ignoring format="hex")
      // — calling toHexString() on the color object directly is what's
      // actually documented to produce a plain "#rrggbb" string.
      onChange={(color) => onChange?.(color.toHexString())}
      onClear={() => onChange?.(undefined)}
      allowClear
      format="hex"
      disabledAlpha
    />
  );
}

interface FormValues {
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  images?: string[];
  variants?: ProductVariant[];
}

export default function ProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | undefined>();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const variantsWatch = Form.useWatch('variants', form);
  const hasVariants = !!variantsWatch?.some((v) => v && (v.size || v.color));
  const computedStock = hasVariants
    ? (variantsWatch ?? []).reduce((sum, v) => sum + (Number(v?.stock) || 0), 0)
    : undefined;

  useEffect(() => {
    if (hasVariants) form.setFieldValue('stock', computedStock);
  }, [hasVariants, computedStock, form]);

  const load = useCallback(async (p = page, s = search, cat = filterCategory) => {
    setLoading(true);
    try {
      const result = await fetchProducts({ page: p, limit: 10, search: s || undefined, category: cat });
      setProducts(result.products);
      setTotal(result.total);
    } catch {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCategory]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  function openCreate() {
    setEditingProduct(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    const catId = typeof product.category === 'string'
      ? product.category
      : (product.category as Category)._id;
    form.setFieldsValue({
      name: product.name,
      description: product.description,
      category: catId,
      price: product.price,
      stock: product.stock,
      images: product.images,
      variants: product.variants,
    });
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!token) return;
    const values = await form.validateFields();
    const payload: Partial<ProductPayload> = {
      ...values,
      images: (values.images ?? []).map((i) => i?.trim()).filter(Boolean),
      variants: (values.variants ?? []).filter((v) => v && (v.size || v.color)),
    };
    setSubmitting(true);
    try {
      if (editingProduct) {
        await updateProduct(token, editingProduct._id, payload);
        message.success('Product updated');
      } else {
        await createProduct(token, payload as ProductPayload);
        message.success('Product created');
      }
      setModalOpen(false);
      load(page, search, filterCategory);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    try {
      await deleteProduct(token, id);
      message.success('Product deleted');
      load(page, search, filterCategory);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Delete failed');
    }
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
    load(1, value, filterCategory);
  }

  function handleCategoryFilter(value: string | undefined) {
    setFilterCategory(value);
    setPage(1);
    load(1, search, value);
  }

  async function handleExport() {
    if (!token) return;
    try {
      const blob = await exportProductsCsv(token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products-export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error('Export failed');
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !token) return;
    setImporting(true);
    try {
      const result = await importProductsCsv(token, file);
      Modal.info({
        title: 'Import complete',
        width: 520,
        content: (
          <div>
            <p>{result.created} product(s) created, {result.updated} updated.</p>
            {result.errors.length > 0 && (
              <>
                <Text type="danger">{result.errors.length} row(s) skipped:</Text>
                <ul style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {result.errors.map((err, i) => (
                    <li key={i}>Row {err.row}: {err.message}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ),
      });
      load(1, search, filterCategory);
      setPage(1);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  const columns: ColumnsType<Product> = [
    {
      title: 'Image',
      dataIndex: 'images',
      key: 'images',
      width: 72,
      render: (images: string[]) =>
        images?.[0] ? (
          <Image src={images[0]} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 6 }} />
        ) : (
          <div style={styles.imagePlaceholder}>
            <ShoppingOutlined style={{ color: '#9CA3AF' }} />
          </div>
        ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Product) => (
        <div>
          <div style={{ fontWeight: 500, color: '#111827' }}>
            {name}
            {record.variants?.length > 0 && (
              <Tag color="blue" style={{ marginLeft: 8 }}>{record.variants.length} variants</Tag>
            )}
            {record.images?.length > 1 && (
              <Tag style={{ marginLeft: 4 }}>{record.images.length} photos</Tag>
            )}
          </div>
          {record.description && (
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              {record.description.length > 60
                ? record.description.slice(0, 60) + '…'
                : record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat: Category | string) => {
        const name = typeof cat === 'string' ? cat : cat?.name;
        return <Tag color="purple">{name}</Tag>;
      },
      width: 150,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 110,
      sorter: (a, b) => a.price - b.price,
      render: (price: number) => (
        <span style={{ fontWeight: 600, color: '#111827' }}>${price.toFixed(2)}</span>
      ),
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (stock: number) => (
        <Badge
          count={stock}
          showZero
          style={{
            backgroundColor: stock === 0 ? '#EF4444' : stock < 10 ? '#F97316' : '#10B981',
          }}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: Product) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this product?"
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
          <ShoppingOutlined style={{ fontSize: 22, color: '#660033' }} />
          <Title level={3} style={{ margin: 0 }}>Products</Title>
        </Space>
        <Space>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <Button icon={<UploadOutlined />} loading={importing} onClick={handleImportClick}>
            Import CSV
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Export CSV
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New Product
          </Button>
        </Space>
      </div>

      <Card style={styles.card}>
        <div style={styles.filters}>
          <Search
            placeholder="Search products..."
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 280 }}
            onSearch={handleSearch}
            onChange={(e) => { if (!e.target.value) handleSearch(''); }}
          />
          <Select
            placeholder="Filter by category"
            allowClear
            style={{ width: 200 }}
            options={categories.map((c) => ({ value: c._id, label: c.name }))}
            onChange={handleCategoryFilter}
          />
        </div>

        <Table
          rowKey="_id"
          dataSource={products}
          columns={columns}
          loading={loading}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            showTotal: (t) => `${t} products`,
            onChange: (p) => { setPage(p); load(p, search, filterCategory); },
          }}
        />
      </Card>

      <Modal
        title={editingProduct ? 'Edit Product' : 'New Product'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editingProduct ? 'Save' : 'Create'}
        confirmLoading={submitting}
        destroyOnClose
        width={640}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Product Name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="e.g. Silk Evening Gown" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional description…" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Category is required' }]}
          >
            <Select
              placeholder="Select category"
              options={categories.map((c) => ({ value: c._id, label: c.name }))}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="price"
              label="Price ($)"
              rules={[
                { required: true, message: 'Price is required' },
                { type: 'number', min: 0, message: 'Must be ≥ 0' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={2}
                placeholder="0.00"
              />
            </Form.Item>

            <Form.Item
              name="stock"
              label={hasVariants ? 'Stock (total across variants)' : 'Stock'}
              rules={[
                { required: true, message: 'Stock is required' },
                { type: 'number', min: 0, message: 'Must be ≥ 0' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={0}
                placeholder="0"
                disabled={hasVariants}
              />
            </Form.Item>
          </div>

          <Form.Item label="Images (first one is used as the thumbnail)">
            <Form.List name="images">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        name={field.name}
                        style={{ flex: 1, marginBottom: 0 }}
                        rules={[{ required: true, message: 'URL required' }]}
                      >
                        <Input placeholder="https://…" style={{ width: 420 }} />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                    Add Image
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item label="Variants (sizes/colors — leave empty for a simple product)">
            <Form.List name="variants">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item name={[field.name, 'size']} style={{ marginBottom: 0 }}>
                        <Input placeholder="Size (e.g. M)" style={{ width: 100 }} />
                      </Form.Item>
                      <Form.Item name={[field.name, 'color']} style={{ marginBottom: 0 }}>
                        <VariantColorInput />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'stock']}
                        style={{ marginBottom: 0 }}
                        rules={[{ required: true, message: 'Stock required' }]}
                      >
                        <InputNumber min={0} precision={0} placeholder="Stock" style={{ width: 90 }} />
                      </Form.Item>
                      <Form.Item name={[field.name, 'priceOverride']} style={{ marginBottom: 0 }}>
                        <InputNumber min={0} precision={2} placeholder="Price override" style={{ width: 130 }} />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add({ stock: 0 })} icon={<PlusOutlined />}>
                    Add Variant
                  </Button>
                </>
              )}
            </Form.List>
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
  filters: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: 48,
    height: 48,
    background: '#F3F4F6',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
