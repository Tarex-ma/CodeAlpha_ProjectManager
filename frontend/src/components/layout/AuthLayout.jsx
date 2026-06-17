import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-sm p-8 sm:p-10">
        <Outlet />
      </div>
    </div>
  );
}