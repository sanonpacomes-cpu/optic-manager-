import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const ROLE_LABELS = {
  admin: 'Administrateur',
  direction: 'Direction',
  responsable_agence: "Responsable d'agence",
  vendeur: 'Vendeur',
  comptable: 'Comptable'
};

const ROLE_PERMISSIONS = {
  admin: ['dashboard','users','roles','sales','agencies','stock','insurance','reports','settings'],
  direction: ['dashboard','users','sales','agencies','stock','insurance','reports'],
  responsable_agence: ['dashboard','sales','stock','insurance','reports'],
  vendeur: ['dashboard','sales'],
  comptable: ['dashboard','sales','insurance','reports']
};

function can(user, page) {
  return ROLE_PERMISSIONS[user?.role]?.includes(page);
}

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
  const [loginId, setLoginId] = useState('ADM001');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ login_id: loginId, password })
      });
      localStorage.setItem('optic_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-icon">OM</div>
        <p className="eyebrow">CENTRE D'OPTIQUE SAINT JEAN-BAPTISTE</p>
        <h1>Connexion par identifiant</h1>
        <p className="muted">Chaque agent se connecte avec un identifiant interne et un mot de passe.</p>

        <label>Identifiant</label>
        <input value={loginId} onChange={e => setLoginId(e.target.value.toUpperCase())} placeholder="Ex : DOR001" />

        <label>Mot de passe</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />

        {error && <div className="error">{error}</div>}

        <button>Se connecter</button>

        <div className="hint">
          Admin : ADM001 / admin123<br />
          Direction : DIR001 / direction123<br />
          Vendeur : DOR001 / vente123
        </div>
      </form>
    </main>
  );
}

function StatCard({ title, value, icon }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><span>{title}</span><strong>{value}</strong></div>;
}

function Dashboard({ user, users, sales }) {
  const visibleSales = filterByUser(user, sales);
  const ca = visibleSales.filter(s => s.status === 'terminee').reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

  return (
    <section className="page">
      <div className="stats-grid">
        <StatCard icon="🔐" title="Identifiant" value={user.login_id} />
        <StatCard icon="👤" title="Rôle" value={ROLE_LABELS[user.role] || user.role} />
        <StatCard icon="🏢" title="Agence" value={user.agency_name || 'Toutes'} />
        <StatCard icon="💰" title="CA visible" value={money(ca)} />
      </div>

      <div className="panel hero-panel">
        <p className="eyebrow">SESSION UTILISATEUR</p>
        <h2>{user.full_name}</h2>
        <p className="muted">
          Connexion : <strong>{user.login_id}</strong><br />
          Dernière connexion enregistrée dans la base de données.
        </p>
      </div>

      <div className="panel">
        <h2>Menus autorisés</h2>
        <div className="permission-grid">
          {(ROLE_PERMISSIONS[user.role] || []).map(p => <span key={p}>{p}</span>)}
        </div>
      </div>
    </section>
  );
}

function filterByUser(user, sales) {
  if (!user) return [];
  if (['admin','direction','comptable'].includes(user.role)) return sales;
  if (user.role === 'responsable_agence') return sales.filter(s => s.agency_name === user.agency_name);
  if (user.role === 'vendeur') return sales.filter(s => s.seller_identifier === user.login_id || s.seller_email === user.email || s.agency_name === user.agency_name);
  return [];
}

function UsersPage({ user, users, agencies, refresh }) {
  const [form, setForm] = useState({
    full_name: '',
    login_id: '',
    password: '',
    role: 'vendeur',
    agency_name: 'Dori',
    phone: '',
    email: '',
    auto_id: true
  });
  const [editing, setEditing] = useState(null);
  const allowedRoles = user.role === 'admin'
    ? ['admin','direction','responsable_agence','vendeur','comptable']
    : ['responsable_agence','vendeur','comptable'];

  async function generateId(role = form.role, agency = form.agency_name) {
    try {
      const data = await api(`/api/generate-login-id?role=${encodeURIComponent(role)}&agency=${encodeURIComponent(agency || '')}`);
      setForm(f => ({ ...f, login_id: data.login_id }));
    } catch (err) {
      alert(err.message);
    }
  }

  useEffect(() => {
    if (!editing && form.auto_id) generateId(form.role, form.agency_name);
  }, [form.role, form.agency_name]);

  async function submit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await api('/api/users', { method: 'PATCH', body: JSON.stringify({ id: editing.id, ...form }) });
      } else {
        await api('/api/users', { method: 'POST', body: JSON.stringify(form) });
      }

      alert(editing ? 'Utilisateur mis à jour.' : `Utilisateur créé. Identifiant : ${form.login_id}`);
      setEditing(null);
      setForm({ full_name:'', login_id:'', password:'', role:'vendeur', agency_name:'Dori', phone:'', email:'', auto_id:true });
      refresh();
    } catch (err) {
      alert(err.message);
    }
  }

  function edit(u) {
    setEditing(u);
    setForm({
      full_name: u.full_name || '',
      login_id: u.login_id || '',
      password: '',
      role: u.role || 'vendeur',
      agency_name: u.agency_name || '',
      phone: u.phone || '',
      email: u.email || '',
      auto_id: false
    });
  }

  async function toggle(u) {
    if (u.id === user.id) return alert('Tu ne peux pas désactiver ton propre compte.');
    await api('/api/users', { method: 'PATCH', body: JSON.stringify({ id: u.id, is_active: !u.is_active }) });
    refresh();
  }

  async function resetPassword(u) {
    const password = prompt('Nouveau mot de passe pour ' + u.full_name);
    if (!password) return;
    await api('/api/users', { method: 'PATCH', body: JSON.stringify({ id: u.id, password }) });
    alert('Mot de passe mis à jour.');
    refresh();
  }

  return (
    <section className="page">
      <div className="panel">
        <h2>{editing ? 'Modifier utilisateur' : 'Créer un utilisateur'}</h2>
        <form className="form-grid" onSubmit={submit}>
          <label>Nom complet
            <input required value={form.full_name} onChange={e => setForm({...form, full_name:e.target.value})} />
          </label>

          <label>Identifiant
            <input required disabled={!!editing} value={form.login_id} onChange={e => setForm({...form, login_id:e.target.value.toUpperCase(), auto_id:false})} />
          </label>

          {!editing && (
            <label className="check">
              <input type="checkbox" checked={form.auto_id} onChange={e => setForm({...form, auto_id:e.target.checked})} />
              Générer automatiquement
            </label>
          )}

          <label>{editing ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
            <input required={!editing} value={form.password} onChange={e => setForm({...form, password:e.target.value})} />
          </label>

          <label>Rôle
            <select value={form.role} onChange={e => setForm({...form, role:e.target.value})}>
              {allowedRoles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </label>

          <label>Agence
            <select value={form.agency_name || ''} onChange={e => setForm({...form, agency_name:e.target.value})}>
              <option value="">Toutes agences</option>
              {agencies.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </label>

          <label>Téléphone
            <input value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} />
          </label>

          <label>Email optionnel
            <input value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
          </label>

          <button>{editing ? 'Mettre à jour' : 'Créer le compte'}</button>
          {editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setForm({ full_name:'', login_id:'', password:'', role:'vendeur', agency_name:'Dori', phone:'', email:'', auto_id:true }); }}>Annuler</button>}
        </form>
      </div>

      <div className="panel">
        <h2>Utilisateurs</h2>
        <div className="cards-list">
          {users.map(u => (
            <div className="user-card" key={u.id}>
              <div>
                <strong>{u.full_name}</strong>
                <span>Identifiant : <b>{u.login_id}</b></span>
                <small>{ROLE_LABELS[u.role] || u.role} · {u.agency_name || 'Toutes agences'} · Connexions : {u.login_count || 0}</small>
              </div>
              <div className="user-actions">
                <button className="small secondary" onClick={() => edit(u)}>Modifier</button>
                <button className="small secondary" onClick={() => resetPassword(u)}>Mot de passe</button>
                <button className={u.is_active ? 'small success' : 'small danger'} onClick={() => toggle(u)}>{u.is_active ? 'Actif' : 'Inactif'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RolesPage() {
  const rows = [
    ['admin','Accès total : utilisateurs, agences, ventes, stock, rapports, paramètres.'],
    ['direction','Vue globale sur toutes les agences, rapports et suivi général.'],
    ['responsable_agence','Vue sur son agence, ses vendeurs, ses ventes et son stock.'],
    ['vendeur','Création et suivi des ventes de son agence.'],
    ['comptable','Consultation ventes, assurances, paiements et rapports.']
  ];

  return (
    <section className="page">
      <div className="panel">
        <h2>Rôles et accès</h2>
        <div className="cards-list">
          {rows.map(([role, desc]) => (
            <div className="list-card" key={role}>
              <div>
                <strong>{ROLE_LABELS[role]}</strong>
                <span>{desc}</span>
              </div>
              <div className="permission-grid mini">
                {ROLE_PERMISSIONS[role].map(p => <span key={p}>{p}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AgenciesPage({ agencies, refresh }) {
  const [form, setForm] = useState({ name:'', city:'', manager_name:'', phone:'' });

  async function submit(e) {
    e.preventDefault();
    await api('/api/agencies', { method:'POST', body: JSON.stringify(form) });
    setForm({ name:'', city:'', manager_name:'', phone:'' });
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
          <button>Ajouter l'agence</button>
        </form>
      </div>

      <div className="panel">
        <h2>Agences</h2>
        <div className="cards-list">
          {agencies.map(a => <div className="list-card" key={a.id}><div><strong>{a.name}</strong><span>{a.city || ''}</span></div></div>)}
        </div>
      </div>
    </section>
  );
}

function SalesPage({ user, sales }) {
  const visibleSales = filterByUser(user, sales);
  return (
    <section className="page">
      <div className="panel">
        <h2>Ventes visibles</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Statut</th><th>Agence</th><th>Vendeur</th><th>Client</th><th>Total</th></tr></thead>
            <tbody>
              {visibleSales.length === 0 && <tr><td colSpan="6">Aucune vente visible.</td></tr>}
              {visibleSales.map(s => (
                <tr key={s.id}>
                  <td>{s.sale_date}</td><td>{s.status}</td><td>{s.agency_name}</td><td>{s.seller_identifier || s.seller_email}</td><td>{s.client_name}</td><td>{money(s.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      const calls = [api('/api/agencies'), api('/api/sales')];
      if (can(user, 'users')) calls.push(api('/api/users'));
      const results = await Promise.all(calls);
      setAgencies(results[0].agencies || []);
      setSales(results[1].sales || []);
      setUsers(results[2]?.users || []);
    } catch (err) {
      alert('Erreur : ' + err.message + '. Ouvre /api/setup si nécessaire.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [user]);

  if (!user) return <Login onLogin={setUser} />;

  const allNav = [
    ['dashboard','Tableau de bord','📊'],
    ['users','Utilisateurs','👥'],
    ['roles','Rôles','🔐'],
    ['sales','Ventes','🧾'],
    ['agencies','Agences','🏢'],
    ['stock','Stock','📦'],
    ['insurance','Assurances','🛡️'],
    ['reports','Rapports','📈'],
    ['settings','Paramètres','⚙️']
  ];

  const nav = allNav.filter(n => can(user, n[0]));
  if (!can(user, page)) setTimeout(() => setPage('dashboard'), 0);

  return (
    <div className="app">
      <aside className={menuOpen ? 'open' : ''}>
        <div className="aside-head">
          <div className="brand-small">OM</div>
          <div><h2>Optic Manager</h2><p>Saint Jean-Baptiste</p></div>
        </div>

        <div className="user-box">
          <strong>{user.full_name}</strong>
          <span>{user.login_id} · {ROLE_LABELS[user.role] || user.role}</span>
        </div>

        <nav>{nav.map(n => <button key={n[0]} className={page===n[0]?'active':''} onClick={() => {setPage(n[0]); setMenuOpen(false)}}><span>{n[2]}</span>{n[1]}</button>)}</nav>

        <button className="logout" onClick={() => {localStorage.removeItem('optic_user'); setUser(null)}}>Déconnexion</button>
      </aside>

      <main>
        <header className="topbar">
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          <div><p className="eyebrow">IDENTIFIANT & RÔLES</p><h1>{allNav.find(n => n[0]===page)?.[1]}</h1></div>
          <button onClick={loadAll}>{loading ? '...' : 'Actualiser'}</button>
        </header>

        {page === 'dashboard' && <Dashboard user={user} users={users} sales={sales} />}
        {page === 'users' && <UsersPage user={user} users={users} agencies={agencies} refresh={loadAll} />}
        {page === 'roles' && <RolesPage />}
        {page === 'sales' && <SalesPage user={user} sales={sales} />}
        {page === 'agencies' && <AgenciesPage agencies={agencies} refresh={loadAll} />}
        {page === 'stock' && <Placeholder title="Stock" text="Accessible selon le rôle. Module complet à poursuivre ensuite." />}
        {page === 'insurance' && <Placeholder title="Assurances" text="Accessible selon le rôle comptable/direction/admin." />}
        {page === 'reports' && <Placeholder title="Rapports" text="Accessible selon le rôle." />}
        {page === 'settings' && <Placeholder title="Paramètres" text="Réservé à l'administrateur." />}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
