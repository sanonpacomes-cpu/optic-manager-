import { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Sales from './pages/Sales';
import SimplePage from './pages/SimplePage';
import './styles/style.css';

const initialSales = [
  { id: '1', date: new Date().toISOString().slice(0,10), agency: 'Dori', client: 'Client Démo', type: 'Lunettes complètes', seller: 'Vendeuse Démo', amount: 29000 },
  { id: '2', date: new Date().toISOString().slice(0,10), agency: 'Kaya', client: 'Client Assurance', type: 'Verres progressifs', seller: 'Administration', amount: 59000 }
];

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('optic_user') || 'null'));
  const [active, setActive] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sales, setSalesState] = useState(() => JSON.parse(localStorage.getItem('optic_sales') || JSON.stringify(initialSales)));
  const setSales = (v) => { setSalesState(v); localStorage.setItem('optic_sales', JSON.stringify(v)); };
  const login = (u) => { setUser(u); localStorage.setItem('optic_user', JSON.stringify(u)); };
  const logout = () => { setUser(null); localStorage.removeItem('optic_user'); };
  if (!user) return <Login onLogin={login} />;
  const pages = {
    dashboard: <Dashboard sales={sales} />,
    sales: <Sales sales={sales} setSales={setSales} user={user} />,
    clients: <SimplePage title="Clients" text="Ici nous ajouterons l’historique complet des clients, leurs ordonnances, achats et contacts." />,
    insurance: <SimplePage title="Assurances" text="Ici nous gérerons les clients assurés, les sociétés d’assurance, les dossiers et les statuts de remboursement." />,
    documents: <SimplePage title="Ordonnances & reçus" text="Ici seront classés les scans d’ordonnances, reçus et preuves de paiement." />,
    agencies: <SimplePage title="Agences" text="Ici nous gérerons les 8 agences, leurs responsables et leurs performances." />,
    reports: <SimplePage title="Rapports" text="Ici nous générerons les rapports PDF et Excel par jour, semaine, mois et agence." />,
  };
  return <div className="app"><Sidebar active={active} setActive={setActive} open={menuOpen} setOpen={setMenuOpen}/><main className="main"><Header user={user} onLogout={logout} onMenu={() => setMenuOpen(true)}/>{pages[active]}</main></div>;
}
