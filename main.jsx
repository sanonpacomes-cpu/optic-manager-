import React, { useEffect, useMemo, useState } from 'react';
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
  admin: ['dashboard','sales','users','roles','agencies','stock','insurance','reports','settings'],
  direction: ['dashboard','sales','users','agencies','stock','insurance','reports'],
  responsable_agence: ['dashboard','sales','stock','insurance','reports'],
  vendeur: ['dashboard','sales'],
  comptable: ['dashboard','sales','insurance','reports']
};

const SALE_STATUSES = {
  brouillon: 'Brouillon',
  en_attente: 'En attente',
  commandee: 'Commandée',
  recue: 'Reçue',
  livree: 'Livrée',
  annulee: 'Annulée'
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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (file.size > 900000) return reject(new Error('Fichier trop lourd. Maximum conseillé : 900 Ko.'));
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, data: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function filterSalesByUser(user, sales) {
  if (!user) return [];
  if (['admin','direction','comptable'].includes(user.role)) return sales;
  if (user.role === 'responsable_agence') return sales.filter(s => s.agency_name === user.agency_name);
  if (user.role === 'vendeur') return sales.filter(s => s.seller_identifier === user.login_id || s.agency_name === user.agency_name);
  return [];
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
        <h1>Optic Manager V6</h1>
        <p className="muted">Connexion par identifiant, rôles et ventes professionnelles.</p>

        <label>Identifiant</label>
        <input value={loginId} onChange={e => setLoginId(e.target.value.toUpperCase())} />

        <label>Mot de passe</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />

        {error && <div className="error">{error}</div>}

        <button>Se connecter</button>

        <div className="hint">
          Admin : ADM001 / admin123<br/>
          Direction : DIR001 / direction123<br/>
          Vendeur : DOR001 / vente123
        </div>
      </form>
    </main>
  );
}

function StatCard({ title, value, icon }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><span>{title}</span><strong>{value}</strong></div>;
}

function Dashboard({ user, sales, users }) {
  const visibleSales = filterSalesByUser(user, sales);
  const validSales = visibleSales.filter(s => ['livree','recue','commandee'].includes(s.status));
  const total = validSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const pending = visibleSales.filter(s => ['brouillon','en_attente'].includes(s.status)).length;
  const remaining = visibleSales.filter(s => s.status !== 'annulee').reduce((sum, s) => sum + Math.max(0, Number(s.total_amount || 0) - Number(s.paid_amount || 0) - Number(s.insurance_amount || 0)), 0);
  const today = new Date().toISOString().slice(0,10);
  const reminders = visibleSales.filter(s => s.follow_up_date === today && !['livree','annulee'].includes(s.status)).length;

  return (
    <section className="page">
      <div className="stats-grid">
        <StatCard icon="💰" title="CA visible" value={money(total)} />
        <StatCard icon="🧾" title="Ventes visibles" value={visibleSales.length} />
        <StatCard icon="🟡" title="Brouillons / attente" value={pending} />
        <StatCard icon="🔔" title="Relances aujourd'hui" value={reminders} />
      </div>

      <div className="panel hero-panel">
        <p className="eyebrow">SESSION</p>
        <h2>{user.full_name}</h2>
        <p className="muted">
          Identifiant : <strong>{user.login_id}</strong><br/>
          Rôle : <strong>{ROLE_LABELS[user.role] || user.role}</strong><br/>
          Reste à encaisser visible : <strong>{money(remaining)}</strong>
        </p>
      </div>

      <div className="panel">
        <h2>Dernières ventes</h2>
        <SalesTable sales={visibleSales.slice(0, 8)} />
      </div>
    </section>
  );
}

function UsersPage({ user, users, agencies, refresh }) {
  const [form, setForm] = useState({ full_name:'', login_id:'', password:'', role:'vendeur', agency_name:'Dori', phone:'', email:'', auto_id:true });
  const [editing, setEditing] = useState(null);
  const allowedRoles = user.role === 'admin'
    ? ['admin','direction','responsable_agence','vendeur','comptable']
    : ['responsable_agence','vendeur','comptable'];

  async function generateId(role = form.role, agency = form.agency_name) {
    const data = await api(`/api/generate-login-id?role=${encodeURIComponent(role)}&agency=${encodeURIComponent(agency || '')}`);
    setForm(f => ({ ...f, login_id: data.login_id }));
  }

  useEffect(() => {
    if (!editing && form.auto_id) generateId(form.role, form.agency_name).catch(() => {});
  }, [form.role, form.agency_name, editing]);

  async function submit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await api('/api/users', { method:'PATCH', body: JSON.stringify({ id: editing.id, ...form }) });
      } else {
        await api('/api/users', { method:'POST', body: JSON.stringify(form) });
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
    setForm({ full_name:u.full_name || '', login_id:u.login_id || '', password:'', role:u.role || 'vendeur', agency_name:u.agency_name || '', phone:u.phone || '', email:u.email || '', auto_id:false });
  }

  async function toggle(u) {
    if (u.id === user.id) return alert('Tu ne peux pas désactiver ton propre compte.');
    await api('/api/users', { method:'PATCH', body: JSON.stringify({ id:u.id, is_active: !u.is_active }) });
    refresh();
  }

  async function resetPassword(u) {
    const password = prompt('Nouveau mot de passe pour ' + u.full_name);
    if (!password) return;
    await api('/api/users', { method:'PATCH', body: JSON.stringify({ id:u.id, password }) });
    alert('Mot de passe mis à jour.');
    refresh();
  }

  return (
    <section className="page">
      <div className="panel">
        <h2>{editing ? 'Modifier utilisateur' : 'Créer un utilisateur'}</h2>
        <form className="form-grid" onSubmit={submit}>
          <label>Nom complet<input required value={form.full_name} onChange={e => setForm({...form, full_name:e.target.value})}/></label>
          <label>Identifiant<input required disabled={!!editing} value={form.login_id} onChange={e => setForm({...form, login_id:e.target.value.toUpperCase(), auto_id:false})}/></label>
          {!editing && <label className="check"><input type="checkbox" checked={form.auto_id} onChange={e => setForm({...form, auto_id:e.target.checked})}/> Générer automatiquement</label>}
          <label>{editing ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}<input required={!editing} value={form.password} onChange={e => setForm({...form, password:e.target.value})}/></label>
          <label>Rôle<select value={form.role} onChange={e => setForm({...form, role:e.target.value})}>{allowedRoles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select></label>
          <label>Agence<select value={form.agency_name || ''} onChange={e => setForm({...form, agency_name:e.target.value})}><option value="">Toutes agences</option>{agencies.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}</select></label>
          <label>Téléphone<input value={form.phone} onChange={e => setForm({...form, phone:e.target.value})}/></label>
          <label>Email optionnel<input value={form.email} onChange={e => setForm({...form, email:e.target.value})}/></label>
          <button>{editing ? 'Mettre à jour' : 'Créer le compte'}</button>
          {editing && <button type="button" className="secondary" onClick={() => {setEditing(null); setForm({ full_name:'', login_id:'', password:'', role:'vendeur', agency_name:'Dori', phone:'', email:'', auto_id:true });}}>Annuler</button>}
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

function SaleForm({ user, agencies, editing, clearEdit, refresh }) {
  const initial = {
    id:null, sale_type:'vente', status:'brouillon', agency_name:user.agency_name || 'Dori',
    client_name:'', client_phone:'', client_age:'', client_address:'',
    product_type:'Monture + verres unifocaux', frame_brand:'', frame_reference:'', lens_type:'',
    payment_method:'Espèces', total_amount:'', paid_amount:'',
    is_insured:false, insurance_company:'', insurance_number:'', insurance_rate:'', insurance_amount:'',
    follow_up_date:'', notes:'',
    prescription_file_name:'', prescription_file_type:'', prescription_file_data:''
  };
  const [form, setForm] = useState(initial);
  const [fileLabel, setFileLabel] = useState('');

  useEffect(() => {
    if (editing) {
      setForm({ ...initial, ...editing });
      setFileLabel(editing.prescription_file_name || '');
    }
  }, [editing]);

  function set(k,v) { setForm(f => ({...f, [k]:v})); }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const encoded = await fileToBase64(file);
      set('prescription_file_name', encoded.name);
      set('prescription_file_type', encoded.type);
      set('prescription_file_data', encoded.data);
      setFileLabel(encoded.name);
    } catch (err) {
      alert(err.message);
    }
  }

  async function submit(e) {
    e.preventDefault();
    try {
      const payload = { ...form, seller_identifier:user.login_id, seller_name:user.full_name };
      await api('/api/sales', { method: form.id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      setForm(initial);
      setFileLabel('');
      clearEdit && clearEdit();
      refresh();
      alert(form.id ? 'Vente mise à jour.' : 'Vente enregistrée.');
    } catch (err) {
      alert(err.message);
    }
  }

  const remainder = Math.max(0, Number(form.total_amount || 0) - Number(form.paid_amount || 0) - Number(form.insurance_amount || 0));

  return (
    <div className="panel">
      <h2>{form.id ? 'Modifier vente / devis' : 'Nouvelle vente / devis'}</h2>
      <form className="sale-form" onSubmit={submit}>
        <div className="section-title">Type, statut et agence</div>
        <div className="form-grid">
          <label>Type<select value={form.sale_type} onChange={e => set('sale_type', e.target.value)}><option value="vente">Vente</option><option value="devis">Devis</option></select></label>
          <label>Statut<select value={form.status} onChange={e => set('status', e.target.value)}>{Object.entries(SALE_STATUSES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label>Agence<select value={form.agency_name} onChange={e => set('agency_name', e.target.value)}>{agencies.map(a => <option key={a.id}>{a.name}</option>)}</select></label>
          <label>Date relance<input type="date" value={form.follow_up_date || ''} onChange={e => set('follow_up_date', e.target.value)}/></label>
        </div>

        <div className="section-title">Client</div>
        <div className="form-grid">
          <label>Nom client<input required value={form.client_name} onChange={e => set('client_name', e.target.value)}/></label>
          <label>Téléphone<input value={form.client_phone || ''} onChange={e => set('client_phone', e.target.value)}/></label>
          <label>Âge<input type="number" value={form.client_age || ''} onChange={e => set('client_age', e.target.value)}/></label>
          <label>Adresse<input value={form.client_address || ''} onChange={e => set('client_address', e.target.value)}/></label>
        </div>

        <div className="section-title">Ordonnance</div>
        <div className="upload-box">
          <label>Scanner/importer ordonnance
            <input type="file" accept="image/*,application/pdf" capture="environment" onChange={handleFile}/>
          </label>
          <p>{fileLabel ? 'Fichier ajouté : ' + fileLabel : 'Image ou PDF, maximum 900 Ko.'}</p>
        </div>

        <div className="section-title">Produit</div>
        <div className="form-grid">
          <label>Produit<select value={form.product_type} onChange={e => set('product_type', e.target.value)}><option>Monture + verres unifocaux</option><option>Monture + verres progressifs</option><option>Monture seule</option><option>Verres seuls</option><option>Lentilles</option><option>Accessoire</option></select></label>
          <label>Marque monture<input value={form.frame_brand || ''} onChange={e => set('frame_brand', e.target.value)}/></label>
          <label>Référence monture<input value={form.frame_reference || ''} onChange={e => set('frame_reference', e.target.value)}/></label>
          <label>Type de verre<input value={form.lens_type || ''} onChange={e => set('lens_type', e.target.value)}/></label>
        </div>

        <div className="section-title">Paiement</div>
        <div className="form-grid">
          <label>Mode paiement<select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}><option>Espèces</option><option>Orange Money</option><option>Moov Money</option><option>Carte bancaire</option><option>Virement</option></select></label>
          <label>Total<input required type="number" value={form.total_amount} onChange={e => set('total_amount', e.target.value)}/></label>
          <label>Payé<input type="number" value={form.paid_amount || ''} onChange={e => set('paid_amount', e.target.value)}/></label>
          <label>Reste<input readOnly value={money(remainder)}/></label>
        </div>

        <div className="section-title">Assurance</div>
        <div className="form-grid">
          <label className="check"><input type="checkbox" checked={!!form.is_insured} onChange={e => set('is_insured', e.target.checked)}/> Client assuré</label>
          <label>Assurance<input value={form.insurance_company || ''} onChange={e => set('insurance_company', e.target.value)}/></label>
          <label>N° assuré<input value={form.insurance_number || ''} onChange={e => set('insurance_number', e.target.value)}/></label>
          <label>Taux (%)<input type="number" value={form.insurance_rate || ''} onChange={e => set('insurance_rate', e.target.value)}/></label>
          <label>Montant assurance<input type="number" value={form.insurance_amount || ''} onChange={e => set('insurance_amount', e.target.value)}/></label>
        </div>

        <label>Notes<textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)}/></label>

        <div className="actions">
          <button>{form.id ? 'Mettre à jour' : 'Enregistrer'}</button>
          {form.id && <button type="button" className="secondary" onClick={() => {setForm(initial); clearEdit && clearEdit();}}>Annuler modification</button>}
        </div>
      </form>
    </div>
  );
}

function SalesTable({ sales, onEdit, onPrint }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>N°</th><th>Type</th><th>Date</th><th>Statut</th><th>Agence</th><th>Vendeur</th><th>Client</th><th>Total</th><th>Payé</th><th>Ordonnance</th><th>Actions</th></tr></thead>
        <tbody>
          {sales.length === 0 && <tr><td colSpan="11">Aucune vente</td></tr>}
          {sales.map(s => (
            <tr key={s.id}>
              <td>{s.sale_number || s.id}</td>
              <td>{s.sale_type || 'vente'}</td>
              <td>{s.sale_date}</td>
              <td><span className={'badge ' + (s.status || 'brouillon')}>{SALE_STATUSES[s.status] || s.status}</span></td>
              <td>{s.agency_name}</td>
              <td>{s.seller_identifier || '-'}</td>
              <td>{s.client_name}</td>
              <td>{money(s.total_amount)}</td>
              <td>{money(s.paid_amount)}</td>
              <td>{s.prescription_file_data ? <a href={s.prescription_file_data} target="_blank">Voir</a> : '-'}</td>
              <td><div className="row-actions">{onEdit && <button className="small secondary" onClick={() => onEdit(s)}>Modifier</button>}{onPrint && <button className="small" onClick={() => onPrint(s)}>Facture</button>}</div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SalesPage({ user, agencies, sales, refresh }) {
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('tous');
  const [search, setSearch] = useState('');
  const visible = filterSalesByUser(user, sales);
  const filtered = visible.filter(s => {
    const statusOk = filter === 'tous' || s.status === filter;
    const term = search.toLowerCase();
    const searchOk = !term || [s.sale_number, s.client_name, s.client_phone, s.agency_name, s.seller_identifier].some(v => String(v || '').toLowerCase().includes(term));
    return statusOk && searchOk;
  });

  function printSale(s) {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Facture ${s.sale_number}</title><style>body{font-family:Arial;padding:30px}h1{color:#1554b8}.box{border:1px solid #ddd;padding:18px;border-radius:12px;margin:12px 0}table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid #eee}</style></head>
      <body>
        <h1>Centre d'Optique Saint Jean-Baptiste</h1>
        <h2>Facture / Reçu : ${s.sale_number || s.id}</h2>
        <div class="box"><strong>Client :</strong> ${s.client_name}<br/><strong>Téléphone :</strong> ${s.client_phone || ''}<br/><strong>Agence :</strong> ${s.agency_name}<br/><strong>Vendeur :</strong> ${s.seller_identifier || ''}</div>
        <table><tr><td>Produit</td><td>${s.product_type || ''}</td></tr><tr><td>Total</td><td>${money(s.total_amount)}</td></tr><tr><td>Payé</td><td>${money(s.paid_amount)}</td></tr><tr><td>Assurance</td><td>${money(s.insurance_amount)}</td></tr><tr><td>Reste</td><td>${money(Math.max(0, Number(s.total_amount||0)-Number(s.paid_amount||0)-Number(s.insurance_amount||0)))}</td></tr></table>
        <p>Merci pour votre confiance.</p>
        <script>window.print()</script>
      </body></html>
    `);
    win.document.close();
  }

  return (
    <section className="page">
      <SaleForm user={user} agencies={agencies} editing={editing} clearEdit={() => setEditing(null)} refresh={refresh} />
      <div className="panel">
        <div className="panel-head">
          <h2>Historique des ventes</h2>
          <div className="filters">
            <input placeholder="Recherche client, numéro, agence..." value={search} onChange={e => setSearch(e.target.value)}/>
            <select value={filter} onChange={e => setFilter(e.target.value)}><option value="tous">Tous</option>{Object.entries(SALE_STATUSES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select>
          </div>
        </div>
        <SalesTable sales={filtered} onEdit={setEditing} onPrint={printSale}/>
      </div>
    </section>
  );
}

function RolesPage() {
  const rows = Object.keys(ROLE_LABELS).map(role => [role, ROLE_PERMISSIONS[role]]);
  return <section className="page"><div className="panel"><h2>Rôles et permissions</h2><div className="cards-list">{rows.map(([role, perms]) => <div className="list-card" key={role}><div><strong>{ROLE_LABELS[role]}</strong><span>{perms.join(', ')}</span></div></div>)}</div></div></section>;
}

function AgenciesPage({ agencies }) {
  return <section className="page"><div className="panel"><h2>Agences</h2><div className="cards-list">{agencies.map(a => <div className="list-card" key={a.id}><div><strong>{a.name}</strong><span>{a.city || ''}</span></div></div>)}</div></div></section>;
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
    ['sales','Ventes','🧾'],
    ['users','Utilisateurs','👥'],
    ['roles','Rôles','🔐'],
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
        <div className="aside-head"><div className="brand-small">OM</div><div><h2>Optic Manager</h2><p>Saint Jean-Baptiste</p></div></div>
        <div className="user-box"><strong>{user.full_name}</strong><span>{user.login_id} · {ROLE_LABELS[user.role]}</span></div>
        <nav>{nav.map(n => <button key={n[0]} className={page===n[0]?'active':''} onClick={() => {setPage(n[0]); setMenuOpen(false)}}><span>{n[2]}</span>{n[1]}</button>)}</nav>
        <button className="logout" onClick={() => {localStorage.removeItem('optic_user'); setUser(null)}}>Déconnexion</button>
      </aside>

      <main>
        <header className="topbar">
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          <div><p className="eyebrow">ERP OPTIQUE V6</p><h1>{allNav.find(n => n[0]===page)?.[1]}</h1></div>
          <button onClick={loadAll}>{loading ? '...' : 'Actualiser'}</button>
        </header>

        {page === 'dashboard' && <Dashboard user={user} sales={sales} users={users}/>}
        {page === 'sales' && <SalesPage user={user} agencies={agencies} sales={sales} refresh={loadAll}/>}
        {page === 'users' && <UsersPage user={user} users={users} agencies={agencies} refresh={loadAll}/>}
        {page === 'roles' && <RolesPage/>}
        {page === 'agencies' && <AgenciesPage agencies={agencies}/>}
        {page === 'stock' && <Placeholder title="Stock" text="Module stock à réintégrer après stabilisation du module ventes."/>}
        {page === 'insurance' && <Placeholder title="Assurances" text="Les ventes enregistrent déjà assurance, numéro, taux et montant. Le suivi des remboursements viendra ensuite."/>}
        {page === 'reports' && <Placeholder title="Rapports" text="Export Excel/PDF et graphiques à venir."/>}
        {page === 'settings' && <Placeholder title="Paramètres" text="Réservé à l'administrateur."/>}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
