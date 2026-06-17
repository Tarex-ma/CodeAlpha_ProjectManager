import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-[#222] p-4 bg-[#111] text-white flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4">Menu</h2>
      <nav className="flex-1 space-y-2">
        <Link to="/" className="block py-2 px-3 rounded hover:bg-[#222]">Dashboard</Link>
        <Link to="/projects" className="block py-2 px-3 rounded hover:bg-[#222]">Projects</Link>
        <Link to="/tasks" className="block py-2 px-3 rounded hover:bg-[#222]">My Tasks</Link>
        <Link to="/teams" className="block py-2 px-3 rounded hover:bg-[#222]">Teams</Link>
        <Link to="/calendar" className="block py-2 px-3 rounded hover:bg-[#222]">Calendar</Link>
      </nav>
    </aside>
  );
}
