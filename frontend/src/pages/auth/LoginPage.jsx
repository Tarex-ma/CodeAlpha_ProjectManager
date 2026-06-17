import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm, validators } from '../../hooks/useForm';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';

/* ─── Validation rules ─────────────────────────────────────────── */
const RULES = {
  email:    [validators.required, validators.email],
  password: [validators.required, validators.minLength(6)],
};

const INITIAL = { email: '', password: '', remember: false };

/* ─── Divider ───────────────────────────────────────────────────── */
function Divider({ text }) {
  return (
    <div className="relative flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-slate-400 text-xs uppercase tracking-widest">{text}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

/* ─── Google icon ───────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

/* ─── GitHub icon ───────────────────────────────────────────────── */
const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

/* ─── LoginPage ─────────────────────────────────────────────────── */
export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const { values, errors, handleChange, handleBlur, validateAll } = useForm(INITIAL, RULES);

  /* Redirect if already logged in */
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  /* Clear API error when user types */
  useEffect(() => {
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.email, values.password]);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    const res = await login({ email: values.email, password: values.password });
    if (res.success) navigate(from, { replace: true });
  };

  return (
    <div className="animate-fadeIn">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Welcome back</h1>
        <p className="text-sm text-slate-500 mt-1.5">Enter your credentials to access your account</p>
      </div>

      {/* API error banner */}
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
        >
          <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Redirected notice */}
      {location.state?.from && !error && (
        <div className="mb-5 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M13 9h-2V7h2m0 10h-2v-6h2m-1-9A10 10 0 002 12a10 10 0 0010 10 10 10 0 0010-10A10 10 0 0012 2z"/>
          </svg>
          <p className="text-sm text-blue-700">Please sign in to continue.</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <InputField
          label="Email"
          name="email"
          type="email"
          placeholder="name@company.com"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          disabled={isLoading}
          autoComplete="email"
        />

        <InputField
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
          disabled={isLoading}
          autoComplete="current-password"
          rightLabel={
            <a href="#" className="text-xs font-semibold text-[#2196f3] hover:text-[#1976d2] transition-colors">
              Forgot password?
            </a>
          }
        />

        {/* Remember me */}
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              name="remember"
              checked={values.remember}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-4 h-4 border border-slate-300 rounded bg-white peer-checked:bg-[#2196f3] peer-checked:border-[#2196f3] transition-all" />
            <svg
              className="absolute inset-0 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 8l3 3 6-6" />
            </svg>
          </div>
          <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors select-none">
            Remember me for 30 days
          </span>
        </label>

        <Button type="submit" variant="primary" fullWidth loading={isLoading} className="mt-1">
          Sign in
        </Button>
      </form>

      <Divider text="or continue with" />

      {/* Social buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="social" fullWidth icon={<GoogleIcon />}>Google</Button>
        <Button variant="social" fullWidth icon={<GithubIcon />}>GitHub</Button>
      </div>

      {/* Register link */}
      <p className="text-center text-sm text-slate-500 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-[#2196f3] hover:text-[#1976d2] font-medium transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}

