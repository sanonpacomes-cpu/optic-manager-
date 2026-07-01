import { BarChart3, Building2, FileImage, Home, ShieldCheck, ShoppingCart, Users, X } from 'lucide-react';

const items = [
  { id: 'dashboard', label: 'Tableau de bord', icon: Home },
  { id: 'sales', label: 'Ventes', icon: ShoppingCart },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'insurance', label: 'Assurances', icon: ShieldCheck },
  { id: 'documents', label: 'Ordonnances & reçus', icon: FileImage },
  { id: 'agencies', label: 'Agences', icon: Building2 },
  { id: 'reports', label: 'Rapports', icon: BarChart3 },
];

export default function Sidebar({ active, setActive, open, setOpen }) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="logo">OM</div>
        <div><strong>Optic Manager</strong><span>ERP optique</span></div>
        <button className="iconButton mobileOnly" onClick={() => setOpen(false)}><X size={20}/></button>
      </div>
      <nav>
        {items.map(item => {
          const Icon = item.icon;
          return <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => { setActive(item.id); setOpen(false); }}><Icon size={20}/>{item.label}</button>
        })}
      </nav>
    </aside>
  );
}
