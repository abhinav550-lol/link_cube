// ─── Login Page ───────────────────────────────────────────────────────────────
// Calls POST /api/user/login. Role-based redirect is driven by user.role
// returned from the backend (not selected by the user at login time).

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((e) => ({ ...e, [field]: '' }));
    setServerError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError('');

    // login() calls POST /api/user/login and stores the returned user in context
    const result = await login(form.email, form.password);
    setLoading(false);

    if (result.success) {
      // Redirect based on role returned by the backend
      navigate(result.role === 'ngo' ? '/ngo/dashboard' : '/volunteer/dashboard');
    } else {
      setServerError(result.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-snow flex">
      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex w-1/2 bg-ink flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-ink text-lg font-display font-bold">LC</span>
            </div>
            <span className="text-white text-xl font-display font-semibold tracking-wider">LinkCube</span>
          </div>

          <h1 className="text-4xl font-display font-semibold text-white leading-tight mb-4">
            Connecting care<br />with communities.
          </h1>
          <p className="text-silver text-sm leading-relaxed max-w-sm">
            A platform bridging NGOs and local volunteers for coordinated,
            impactful relief work across villages.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6">
          {[   
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-display font-semibold text-white">{s.value}</p>
              <p className="text-xs text-silver mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-display font-bold">LC</span>
            </div>
            <span className="text-ink text-lg font-display font-semibold">LinkCube</span>
          </div>

          <h2 className="text-2xl font-display font-semibold text-ink mb-1">Welcome back</h2>
          <p className="text-sm text-muted mb-8">Sign in to your account to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange('email')}
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange('password')}
              error={errors.password}
            />

            {serverError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-xs text-red-600">{serverError}</p>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign In
            </Button>
          </form>

          <p className="text-sm text-center text-muted mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-ink font-medium hover:underline underline-offset-2">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
