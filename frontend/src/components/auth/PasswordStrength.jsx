import { useMemo } from 'react';

function getStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak',   color: '#e53935' };
  if (score <= 2) return { score, label: 'Fair',   color: '#ff9800' };
  if (score <= 3) return { score, label: 'Good',   color: '#2196f3' };
  return              { score, label: 'Strong', color: '#4caf50' };
}

/**
 * PasswordStrength
 * Props:
 *   password – current password string
 */
export default function PasswordStrength({ password }) {
  const { score, label, color } = useMemo(() => getStrength(password), [password]);

  if (!password) return null;

  const totalBars = 4;
  const filled    = Math.ceil((score / 5) * totalBars);

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {Array.from({ length: totalBars }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < filled ? color : '#2a2a2a' }}
          />
        ))}
      </div>
      <p className="text-[11px]" style={{ color }}>
        {label} password
      </p>
    </div>
  );
}
