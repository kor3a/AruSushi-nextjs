import { FormEvent, useMemo, useState } from 'react';
import Head from 'next/head';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRoleByEmail } from '../../lib/auth/roles';
import { formatBirthday, toDateInputValue } from '../../lib/perks/birthday';

interface MemberBirthday {
  id: string;
  email: string;
  name: string | null;
  birthday: string | null;
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  colorScheme: 'dark' as const,
};

const buttonStyle = (enabled: boolean, background = '#fc3678') => ({
  padding: '12px 20px',
  background: enabled ? background : 'rgba(252, 54, 120, 0.3)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: enabled ? 'pointer' : 'not-allowed',
  whiteSpace: 'nowrap' as const,
});

export default function AdminMembersPage() {
  const { user } = useAuth();
  const isAdmin = useMemo(() => getUserRoleByEmail(user?.email) === 'admin', [user?.email]);
  const [email, setEmail] = useState('');
  const [member, setMember] = useState<MemberBirthday | null>(null);
  const [birthday, setBirthday] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    setMember(null);

    try {
      const response = await fetch(`/api/admin/member-birthday?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to find member');
      }
      setMember(data.member);
      setBirthday(toDateInputValue(data.member.birthday));
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setBusy(false);
    }
  };

  const saveBirthday = async (value: string | null) => {
    if (!member) return;
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/member-birthday', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: member.email, birthday: value }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update birthday');
      }
      setMember(data.member);
      setBirthday(toDateInputValue(data.member.birthday));
      setSuccess(value ? 'Birthday updated.' : 'Birthday cleared. The member can add it again from their profile.');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setBusy(false);
    }
  };

  const birthdayChanged = member !== null && birthday !== toDateInputValue(member.birthday);

  return (
    <>
      <Head>
        <title>Members - A-Ru Sushi Admin</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Header />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        padding: '140px 20px 60px',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#f1d00f', marginBottom: '8px', textAlign: 'center' }}>
            Member Birthdays
          </h1>
          <p style={{ color: '#aaa', fontSize: '14px', textAlign: 'center', marginBottom: '32px' }}>
            Members can add their birthday once from their profile. Use this page to correct it.
          </p>

          {!isAdmin ? (
            <div style={{
              padding: '16px',
              background: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.3)',
              borderRadius: '8px',
              color: '#FF9800',
              textAlign: 'center',
            }}>
              Only admins can change member birthdays.
            </div>
          ) : (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(252, 54, 120, 0.2)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}>
              <form onSubmit={handleLookup} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Member email"
                  aria-label="Member email"
                  style={{ ...inputStyle, flex: '1 1 240px', width: 'auto' }}
                />
                <button type="submit" disabled={busy || !email.trim()} style={buttonStyle(!busy && Boolean(email.trim()))}>
                  {busy && !member ? 'Looking up...' : 'Find Member'}
                </button>
              </form>

              {member && (
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '20px' }}>
                  <p style={{ color: '#fff', fontWeight: 600, marginBottom: '2px' }}>{member.name || 'Unnamed member'}</p>
                  <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '16px' }}>{member.email}</p>
                  <p style={{ color: '#ccc', fontSize: '14px', marginBottom: '12px' }}>
                    Current birthday:{' '}
                    <strong style={{ color: '#f1d00f' }}>
                      {member.birthday ? formatBirthday(member.birthday) : 'Not set'}
                    </strong>
                  </p>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      aria-label="New birthday"
                      style={{ ...inputStyle, flex: '1 1 200px', width: 'auto' }}
                    />
                    <button
                      type="button"
                      disabled={busy || !birthday || !birthdayChanged}
                      onClick={() => saveBirthday(birthday)}
                      style={buttonStyle(!busy && Boolean(birthday) && birthdayChanged)}
                    >
                      Save Birthday
                    </button>
                    {member.birthday && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => saveBirthday(null)}
                        style={{
                          ...buttonStyle(!busy, 'transparent'),
                          border: '1px solid rgba(255, 68, 68, 0.4)',
                          color: '#ff4444',
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}

              {error && <p style={{ color: '#ff4444', fontSize: '14px' }}>{error}</p>}
              {success && <p style={{ color: '#4caf50', fontSize: '14px' }}>{success}</p>}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
