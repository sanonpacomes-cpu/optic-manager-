import { Bell, LogOut, Menu, Search } from 'lucide-react';

export default function Header({ user, onLogout, onMenu }) {
  return (
    <header className="topbar">
      <button className="iconButton mobileOnly" onClick={onMenu}><Menu size={22} /></button>
      <div>
        <p className="eyebrow">Centre d’Optique Saint Jean-Baptiste</p>
        <h1>Optic Manager</h1>
      </div>
      <div className="topbarActions">
        <div className="searchBox"><Search size={18}/><span>Rechercher...</span></div>
        <button className="iconButton"><Bell size={20}/></button>
        <div className="userBadge">
          <strong>{user.name}</strong>
          <span>{user.role} · {user.agency}</span>
        </div>
        <button className="logout" onClick={onLogout}><LogOut size={18}/> Sortir</button>
      </div>
    </header>
  );
}
