import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const DEFAULT_AGENCIES = ['Dori','Somgandé','Kamsonghin','Tengandgo','Kaya','Bobo','Banfora','Gounghin'];

function money(value) {
  return new Intl.NumberFormat('fr-FR').format(Number(value || 0)) + ' FCFA';
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Erreur serveur');
  return data;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@optic.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('optic_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-icon">◉</div>
        <p className="eyebrow">CENTRE D'OPTIQUE SAINT JEAN-BAPTISTE</p>
        <h1>Optic Manager V2</h1>
        <p className="muted">ERP connecté à Neon : agences, utilisateurs, ventes et performances.</p>
        <label>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} />
        <label>Mot de passe</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="error">{error}</div>}
        <button>Se connecter</button>
        <div className="hint">
          Admin : admin@optic.com / admin123<br />
          Vendeuse : vendeuse@optic.com / vente123
        </div>
      </form>
    </main>
  );
}

function StatCard({ title, value, icon }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><span>{title}</span><strong>{value}</strong></div>;
}

function Dashboard({ sales, agencies, users }) {
  const total = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
  const activeAgencies = agencies.filter(a => a.is_active).length;
  const best = useMemo(() => {
    const map = {};
    sales.forEach(s => { map[s.agency_name] = (map[s.agency_name] || 0) + Number(s.total_amount || 0); });
    return Object.entries(map).sort((a,b) => b[1] - a[1])[0] || ['Aucune', 0];
  }, [sales]);

  return (
    <section className="page">
      <div className="stats-grid">
        <StatCard icon="💰" title="Chiffre d'affaires total" value={money(total)} />
        <StatCard icon="🏢" title="Agences actives" value={activeAgencies} />
        <StatCard icon="🧾" title="Ventes enregistrées" value={sales.length} />
        <StatCard icon="👥" title="Utilisateurs" value={users.length} />
      </div>

      <div className="panel hero-panel">
        <div>
          <p className="eyebrow">PERFORMANCE</p>
          <h2>Meilleure agence : {best[0]}</h2>
          <p className="muted">Chiffre d'affaires : <strong>{money(best[1])}</strong></p>
        </div>
      </div>

      <div className="panel">
        <h2>Classement des agences</h2>
        <div className="agency-ranking">
          {agencies.map(agency => {
            const amount = sales.filter(s => s.agency_name === agency.name).reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
            return (
              <div className="rank-row" key={agency.id || agency.name}>
                <div><strong>{agency.name}</strong><small>{agency.city || agency.name}</small></div>
                <span>{money(amount)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <h2>Dernières ventes</h2>
        <Table rows={sales.slice(0, 6)} columns={[
          ['sale_date','Date'], ['agency_name','Agence'], ['client_name','Client'], ['product_type','Type'], ['total_amount','Montant']
        ]} moneyKeys={['total_amount']} />
      </div>
    </section>
  );
}

function Table({ rows, columns, moneyKeys = [] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map(c => <th key={c[0]}>{c[1]}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={columns.length}>Aucune donnée</td></tr>}
          {rows.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map(c => <td key={c[0]}>{moneyKeys.includes(c[0]) ? money(row[c[0]]) : String(row[c[0]] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AgenciesPage({ agencies, refresh }) {
  const [form, setForm] = useState({ name: '', city: '', manager_name: '', phone: '' });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/api/agencies', { method: 'POST', body: JSON.stringify(form) });
      setForm({ name: '', city: '', manager_name: '', phone: '' });
      await refresh();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  }

  async function toggle(agency) {
    await api('/api/agencies', { method: 'PATCH', body: JSON.stringify({ id: agency.id, is_active: !agency.is_active }) });
    refresh();
  }

  return (
    <section className="page">
      <div className="panel">
        <h2>Créer une agence</h2>
        <form className="form-grid" onSubmit={submit}>
          <label>Nom<input required value={form.name} onChange={e => setForm({...form, name:e.target.value})} /></label>
          <label>Ville<input value={form.city} onChange={e => setForm({...form, city:e.target.value})} /></label>
          <label>Responsable<input value={form.manager_name} onChange={e => setForm({...form, manager_name:e.target.value})} /></label>
          <label>Téléphone<input value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} /></label>
          <button disabled={loading}>{loading ? 'Enregistrement...' : 'Ajouter l’agence'}</button>
        </form>
      </div>

      <div className="panel">
        <h2>Agences du réseau</h2>
        <div className="cards-list">
          {agencies.map(a => (
            <div className="list-card" key={a.id}>
              <div>
                <strong>{a.name}</strong>
                <span>{a.city || 'Ville non renseignée'} · {a.manager_name || 'Responsable non renseigné'}</span>
              </div>
              <button className={a.is_active ? 'success' : 'danger'} onClick={() => toggle(a)}>{a.is_active ? 'Active' : 'Inactive'}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UsersPage({ users, agencies, refresh }) {
  const [form, setForm] = useState({ full_name:'', email:'', password:'123456', role:'vendeur', agency_name:'Dori' });

  async function submit(e) {
    e.preventDefault();
    try {
      await api('/api/users', { method:'POST', body: JSON.stringify(form) });
      setForm({ full_name:'', email:'', password:'123456', role:'vendeur', agency_name:'Dori' });
      refresh();
    } catch (err) { alert(err.message); }
  }

  async function toggle(u) {
    await api('/api/users', { method:'PATCH', body: JSON.stringify({ id:u.id, is_active: !u.is_active }) });
    refresh();
  }

  return (
    <section className="page">
      <div className="panel">
        <h2>Créer un utilisateur</h2>
        <form className="form-grid" onSubmit={submit}>
          <label>Nom complet<input required value={form.full_name} onChange={e => setForm({...form, full_name:e.target.value})} /></label>
          <label>Email<input required value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></label>
          <label>Mot de passe<input required value={form.password} onChange={e => setForm({...form, password:e.target.value})} /></label>
          <label>Rôle<select value={form.role} onChange={e => setForm({...form, role:e.target.value})}>
            <option value="admin">Administrateur</option>
            <option value="direction">Direction</option>
            <option value="responsable_agence">Responsable agence</option>
            <option value="vendeur">Vendeur</option>
            <option value="comptable">Comptable</option>
          </select></label>
          <label>Agence<select value={form.agency_name} onChange={e => setForm({...form, agency_name:e.target.value})}>
            <option value="">Toutes agences</option>
            {agencies.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select></label>
          <button>Créer l’utilisateur</button>
        </form>
      </div>

      <div className="panel">
        <h2>Utilisateurs</h2>
        <div className="cards-list">
          {users.map(u => (
            <div className="list-card" key={u.id}>
              <div>
                <strong>{u.full_name}</strong>
                <span>{u.email} · {u.role} · {u.agency_name || 'Toutes agences'}</span>
              </div>
              <button className={u.is_active ? 'success' : 'danger'} onClick={() => toggle(u)}>{u.is_active ? 'Actif' : 'Inactif'}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SalesPage({ user, agencies, sales, refresh }) {
  const [form, setForm] = useState({
    agency_name: user.agency_name || 'Dori',
    client_name:'',
    client_phone:'',
    product_type:'Monture + verres unifocaux',
    total_amount:'',
    paid_amount:'',
    is_insured:false,
    insurance_company:'',
    notes:''
  });

  async function submit(e) {
    e.preventDefault();
    try {
      await api('/api/sales', { method:'POST', body: JSON.stringify({...form, seller_email:user.email}) });
      setForm({...form, client_name:'', client_phone:'', total_amount:'', paid_amount:'', notes:''});
      refresh();
    } catch (err) { alert(err.message); }
  }

  return (
    <section className="page">
      <div className="panel">
        <h2>Enregistrer une vente</h2>
        <form className="form-grid" onSubmit={submit}>
          <label>Agence<select value={form.agency_name} onChange={e => setForm({...form, agency_name:e.target.value})}>{agencies.map(a => <option key={a.id}>{a.name}</option>)}</select></label>
          <label>Client<input required value={form.client_name} onChange={e => setForm({...form, client_name:e.target.value})} /></label>
          <label>Téléphone<input value={form.client_phone} onChange={e => setForm({...form, client_phone:e.target.value})} /></label>
          <label>Type<select value={form.product_type} onChange={e => setForm({...form, product_type:e.target.value})}>
            <option>Monture + verres unifocaux</option><option>Monture + verres progressifs</option><option>Monture seule</option><option>Verres seuls</option><option>Lentilles</option><option>Accessoire</option>
          </select></label>
          <label>Montant total<input required type="number" value={form.total_amount} onChange={e => setForm({...form, total_amount:e.target.value})} /></label>
          <label>Montant payé<input type="number" value={form.paid_amount} onChange={e => setForm({...form, paid_amount:e.target.value})} /></label>
          <label className="check"><input type="checkbox" checked={form.is_insured} onChange={e => setForm({...form, is_insured:e.target.checked})} /> Client assuré</label>
          <label>Assurance<input value={form.insurance_company} onChange={e => setForm({...form, insurance_company:e.target.value})} /></label>
          <button>Enregistrer</button>
        </form>
      </div>

      <div className="panel">
        <h2>Historique des ventes</h2>
        <Table rows={sales} columns={[
          ['sale_date','Date'], ['agency_name','Agence'], ['client_name','Client'], ['product_type','Type'], ['total_amount','Montant'], ['insurance_company','Assurance']
        ]} moneyKeys={['total_amount']} />
      </div>
    </section>
  );
}

function Placeholder({ title, text }) {
  return <section className="page"><div className="panel"><h2>{title}</h2><p className="muted">{text}</p></div></section>;
}

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('optic_user') || 'null'));
  const [page, setPage] = useState('dashboard');
  const [agencies, setAgencies] = useState([]);
  const [users, setUsers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function loadAll() {
    if (!user) return;
    setLoading(true);
    try {
      const [a,u,s] = await Promise.all([
        api('/api/agencies'),
        api('/api/users'),
        api('/api/sales')
      ]);
      setAgencies(a.agencies || []);
      setUsers(u.users || []);
      setSales(s.sales || []);
    } catch (err) {
      alert('Erreur de chargement : ' + err.message + '. Ouvre /api/setup si les tables ne sont pas encore créées.');
    } finally { setLoading(false); }
  }

  useEffect(() => { loadAll(); }, [user]);

  if (!user) return <Login onLogin={setUser} />;

  const nav = [
    ['dashboard','Tableau de bord','📊'],
    ['agencies','Agences','🏢'],
    ['users','Utilisateurs','👥'],
    ['sales','Ventes','🧾'],
    ['stock','Stock','📦'],
    ['insurance','Assurances','🛡️'],
    ['reports','Rapports','📈'],
    ['settings','Paramètres','⚙️']
  ];

  return (
    <div className="app">
      <aside className={menuOpen ? 'open' : ''}>
        <div className="aside-head">
          <div className="brand-small">OM</div>
          <div><h2>Optic Manager</h2><p>Centre d'Optique Saint Jean-Baptiste</p></div>
        </div>
        <div className="user-box">
          <strong>{user.full_name}</strong>
          <span>{user.role} · {user.agency_name || 'Toutes agences'}</span>
        </div>
        <nav>{nav.map(n => <button key={n[0]} className={page===n[0]?'active':''} onClick={() => {setPage(n[0]); setMenuOpen(false)}}><span>{n[2]}</span>{n[1]}</button>)}</nav>
        <button className="logout" onClick={() => {localStorage.removeItem('optic_user'); setUser(null)}}>Déconnexion</button>
      </aside>

      <main>
        <header className="topbar">
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          <div><p className="eyebrow">ERP PROFESSIONNEL</p><h1>{nav.find(n => n[0]===page)?.[1]}</h1></div>
          <button onClick={loadAll}>{loading ? '...' : 'Actualiser'}</button>
        </header>

        {page === 'dashboard' && <Dashboard sales={sales} agencies={agencies} users={users} />}
        {page === 'agencies' && <AgenciesPage agencies={agencies} refresh={loadAll} />}
        {page === 'users' && <UsersPage users={users} agencies={agencies} refresh={loadAll} />}
        {page === 'sales' && <SalesPage user={user} agencies={agencies} sales={sales} refresh={loadAll} />}
        {page === 'stock' && <Placeholder title="Stock" text="Module prévu pour la version 3 : montures, verres, lentilles, accessoires, inventaire et alertes." />}
        {page === 'insurance' && <Placeholder title="Assurances" text="Module prévu : compagnies, dossiers, montants pris en charge, documents et suivi." />}
        {page === 'reports' && <Placeholder title="Rapports" text="Module prévu : export Excel/PDF, statistiques par agence, vendeur, période et type de vente." />}
        {page === 'settings' && <Placeholder title="Paramètres" text="Configuration globale, rôles, permissions et préférences." />}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
