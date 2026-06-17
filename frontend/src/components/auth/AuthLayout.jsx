import { Link } from 'react-router-dom';

const TESTIMONIALS = [
  {
    quote:
      'ProjectFlow transformed how our team manages projects. Productivity up 40% in the first month.',
    name: 'Sarah Miller',
    role: 'Product Manager, TechCorp',
  },
  {
    quote:
      "The cleanest project management UI we've ever used. Our engineers actually enjoy using it.",
    name: 'David Park',
    role: 'Engineering Lead, Nexus',
  },
];

const STATS = [
  { value: '12k+', label: 'Teams' },
  { value: '98%', label: 'Uptime' },
  { value: '4.9★', label: 'Rating' },
];

/**
 * AuthLayout
 * Props:
 *   children         – the form panel (right side)
 *   testimonialIndex – 0 or 1
 */
export default function AuthLayout({ children, testimonialIndex = 0 }) {
  const t = TESTIMONIALS[testimonialIndex % TESTIMONIALS.length];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-stretch">

      {/* ── Left panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[40%] flex-col bg-[#2196f3] relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute bottom-20 -left-16 w-64 h-64 rounded-full bg-white/5" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 w-fit">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <ProjectFlowIcon />
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight">
              ProjectFlow
            </span>
          </Link>

          {/* Testimonial */}
          <div className="flex-1 flex flex-col justify-center py-12">
            <div className="max-w-xs">
              <blockquote className="text-white text-[15px] leading-[1.7] mb-6">
                "{t.quote}"
              </blockquote>
              <p className="text-white font-medium text-[13px]">{t.name}</p>
              <p className="text-white/60 text-[12px] mt-0.5">{t.role}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8 pb-2">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-white font-semibold text-[18px]">{s.value}</p>
                <p className="text-white/60 text-[11px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Footer links */}
          <div className="flex gap-4 mt-6 pt-6 border-t border-white/10">
            {['Terms', 'Privacy', 'Contact'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-white/50 text-[11px] hover:text-white/80 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-10">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2196f3] rounded-lg flex items-center justify-center">
            <ProjectFlowIcon />
          </div>
          <span className="text-white font-semibold text-[15px]">ProjectFlow</span>
        </div>

        <div className="w-full max-w-[360px]">{children}</div>
      </div>
    </div>
  );
}

function ProjectFlowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <line x1="12" y1="7" x2="5" y2="17" />
      <line x1="12" y1="7" x2="19" y2="17" />
    </svg>
  );
}
