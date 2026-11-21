import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/components/AuthLayout';

export default function Login({ onAuthenticated, serverError }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(serverError || '');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') await base44.auth.login(email, password);
      else await base44.auth.register({ email, password, full_name: fullName });
      await onAuthenticated();
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setBusy(false);
    }
  };

  const isLogin = mode === 'login';
  return (
    <AuthLayout
      icon={LogIn}
      title="Clara.ai ERP"
      subtitle={isLogin ? 'Sign in to continue' : 'Create your account'}
      footer={
        <button type="button" className="underline" onClick={() => { setMode(isLogin ? 'register' : 'login'); setError(''); }}>
          {isLogin ? "New here? Create an account" : 'Already have an account? Sign in'}
        </button>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {!isLogin && (
          <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required />
        )}
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        <Input
          type="password" placeholder={isLogin ? 'Password' : 'Password (min 8 characters)'}
          value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={isLogin ? undefined : 8} required
        />
        {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
