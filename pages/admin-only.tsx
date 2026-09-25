import AdminOnly from '../components/AdminOnly';

// Rendered (via middleware rewrite) when a non-admin requests an /admin page.
export default function AdminOnlyPage() {
  return <AdminOnly />;
}
