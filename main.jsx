import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

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
    if (file.size > 900000) return reject(new Error('Fichier trop lourd. Choisis une image/PDF de moins de 900 Ko pour cette V3.'));
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, data: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
        <div className="brand-icon">OM</div>
        <p className="eyebrow">CENTRE D'OPTIQUE SAINT JEAN-BAPTISTE</p>
        <h1>Optic Manager V3</h1>
        <p className="muted">Ventes, brouillons, ordonnances, assurances et paiements.</p>
        <label>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} />
        <label>Mot de passe</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="error">{error}</div>}
        <button>Se connecter</button>
        <div className="hint">
          Admin : admin@optic.com / admin123<br />
          Vendeuse : vendeuse@optic.com / vente123<br />
          Direction : direction@optic.com / direction123
        </div>
      </form>
    </main>
  );
}

function StatCard({ title, value, icon }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><span>{title}</span><strong>{value}</strong></div>;
}

function Dashboard({ sales, agencies, users }) {
  const completed = sales.filter(s => s.status === 'terminee');
  const drafts = sales.filter(s => s.status === 'brouillon');
  const waiting = sales.filter(s => s.status === 'en_attente');
  const total = completed.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
  const remaining = sales.filter(s => s.status !== 'annulee').reduce((sum, sale) => sum + Math.max(0, Number(sale.total_amount || 0) - Number(sale.paid_amount || 0)), 0);

  const best = useMemo(() => {
    const map = {};
    completed.forEach(s => { map[s.agency_name] = (map[s.agency_name] || 0) + Number(s.total_amount || 0); });
    return Object.entries(map).sort((a,b) => b[1] - a[1])[0] || ['Aucune', 0];
  }, [sales]);

  const today = new Date().toISOString().slice(0,10);
  const relances = sales.filter(s => s.follow_up_date === today && s.status !== 'terminee' && s.status !== 'annulee');

  return (
    <section className="page">
      <div className="stats-grid">
        <StatCard icon="💰" title="CA validé" value={money(total)} />
        <StatCard icon="🟡" title="Brouillons" value={drafts.length} />
        <StatCard icon="🔵" title="En attente" value={waiting.length} />
        <StatCard icon="💳" title="Reste à payer" value={money(remaining)} />
      </div>

      <div className="panel hero-panel">
        <div>
          <p className="eyebrow">PILOTAGE</p>
          <h2>Meilleure agence : {best[0]}</h2>
          <p className="muted">Chiffre d'affaires validé : <strong>{money(best[1])}</strong></p>
          <p className="muted">Relances aujourd'hui : <strong>{relances.length}</strong></p>
        </div>
      </div>

      <div className="panel">
        <h2>Classement des agences</h2>
        <div className="agency-ranking">
          {agencies.map(agency => {
            const amount = completed.filter(s => s.agency_name === agency.name).reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
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
        <SalesTable sales={sales.slice(0, 6)} />
      </div>
    </section>
  );
}

function SalesTable({ sales, onEdit }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>N°</th><th>Date</th><th>Statut</th><th>Agence</th><th>Client</th><th>Produit</th><th>Total</th><th>Payé</th><th>Ordonnance</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sales.length === 0 && <tr><td colSpan="10">Aucune vente</td></tr>}
          {sales.map(s => (
            <tr key={s.id}>
              <td>{s.sale_number || s.id}</td>
              <td>{s.sale_date}</td>
              <td><span className={'badge ' + (s.status || 'brouillon')}>{labelStatus(s.status)}</span></td>
              <td>{s.agency_name}</td>
              <td>{s.client_name}</td>
              <td>{s.product_type}</td>
              <td>{money(s.total_amount)}</td>
              <td>{money(s.paid_amount)}</td>
              <td>{s.prescription_file_data ? <a href={s.prescription_file_data} target="_blank">Voir</a> : '-'}</td>
              <td>{onEdit && <button className="small" onClick={() => onEdit(s)}>Modifier</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function labelStatus(status) {
  return {
    brouillon:'Brouillon',
    en_attente:'En attente',
    terminee:'Terminée',
    annulee:'Annulée'
  }[status] || 'Brouillon';
}

function SaleForm({ user, agencies, refresh, editing, clearEdit }) {
  const initial = {
    id: null,
    status:'brouillon',
    agency_name:user.agency_name || 'Dori',
    client_name:'',
    client_phone:'',
    client_age:'',
    client_gender:'',
    client_address:'',
    product_type:'Monture + verres unifocaux',
    frame_brand:'',
    frame_reference:'',
    lens_type:'',
    payment_method:'Espèces',
    total_amount:'',
    paid_amount:'',
    is_insured:false,
    insurance_company:'',
    insurance_number:'',
    insurance_rate:'',
    insurance_amount:'',
    follow_up_date:'',
    notes:'',
    prescription_file_name:'',
    prescription_file_type:'',
    prescription_file_data:''
  };

  const [form, setForm] = useState(initial);
  const [fileLabel, setFileLabel] = useState('');

  useEffect(() => {
    if (editing) {
      setForm({ ...initial, ...editing });
      setFileLabel(editing.prescription_file_name || '');
    }
  }, [editing]);

  function set(k, v) { setForm(f => ({...f, [k]: v})); }

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
      const payload = {...form, seller_email:user.email};
      if (form.id) {
        await api('/api/sales', { method:'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/api/sales', { method:'POST', body: JSON.stringify(payload) });
      }
      setForm(initial);
      setFileLabel('');
      clearEdit && clearEdit();
      refresh();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="panel">
      <h2>{form.id ? 'Modifier la vente' : 'Nouvelle vente'}</h2>
      <form className="sale-form" onSubmit={submit}>
        <div className="section-title">Statut et agence</div>
        <div className="form-grid">
          <label>Statut<select value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="brouillon">Brouillon</option>
            <option value="en_attente">En attente</option>
            <option value="terminee">Terminée</option>
            <option value="annulee">Annulée</option>
          </select></label>
          <label>Agence<select value={form.agency_name} onChange={e => set('agency_name', e.target.value)}>
            {agencies.map(a => <option key={a.id}>{a.name}</option>)}
          </select></label>
          <label>Date de relance<input type="date" value={form.follow_up_date || ''} onChange={e => set('follow_up_date', e.target.value)} /></label>
        </div>

        <div className="section-title">Client</div>
        <div className="form-grid">
          <label>Nom du client<input required value={form.client_name} onChange={e => set('client_name', e.target.value)} /></label>
          <label>Téléphone<input value={form.client_phone || ''} onChange={e => set('client_phone', e.target.value)} /></label>
          <label>Âge<input type="number" value={form.client_age || ''} onChange={e => set('client_age', e.target.value)} /></label>
          <label>Sexe<select value={form.client_gender || ''} onChange={e => set('client_gender', e.target.value)}>
            <option value="">Non renseigné</option><option>Femme</option><option>Homme</option>
          </select></label>
          <label>Adresse<input value={form.client_address || ''} onChange={e => set('client_address', e.target.value)} /></label>
        </div>

        <div className="section-title">Ordonnance</div>
        <div className="upload-box">
          <label>Scanner ou importer ordonnance
            <input type="file" accept="image/*,application/pdf" capture="environment" onChange={handleFile} />
          </label>
          <p>{fileLabel ? 'Fichier ajouté : ' + fileLabel : 'Image ou PDF, maximum 900 Ko pour cette version.'}</p>
        </div>

        <div className="section-title">Produit</div>
        <div className="form-grid">
          <label>Type de vente<select value={form.product_type} onChange={e => set('product_type', e.target.value)}>
            <option>Monture + verres unifocaux</option><option>Monture + verres progressifs</option><option>Monture seule</option><option>Verres seuls</option><option>Lentilles</option><option>Accessoire</option>
          </select></label>
          <label>Marque monture<input value={form.frame_brand || ''} onChange={e => set('frame_brand', e.target.value)} /></label>
          <label>Référence monture<input value={form.frame_reference || ''} onChange={e => set('frame_reference', e.target.value)} /></label>
          <label>Type de verre<input value={form.lens_type || ''} onChange={e => set('lens_type', e.target.value)} /></label>
        </div>

        <div className="section-title">Paiement</div>
        <div className="form-grid">
          <label>Mode de paiement<select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
            <option>Espèces</option><option>Orange Money</option><option>Moov Money</option><option>Carte bancaire</option><option>Virement</option>
          </select></label>
          <label>Montant total<input required type="number" value={form.total_amount} onChange={e => set('total_amount', e.target.value)} /></label>
          <label>Montant payé<input type="number" value={form.paid_amount || ''} onChange={e => set('paid_amount', e.target.value)} /></label>
          <label>Reste à payer<input readOnly value={money(Math.max(0, Number(form.total_amount || 0) - Number(form.paid_amount || 0)))} /></label>
        </div>

        <div className="section-title">Assurance</div>
        <div className="form-grid">
          <label className="check"><input type="checkbox" checked={!!form.is_insured} onChange={e => set('is_insured', e.target.checked)} /> Client assuré</label>
          <label>Compagnie<input value={form.insurance_company || ''} onChange={e => set('insurance_company', e.target.value)} /></label>
          <label>N° assuré<input value={form.insurance_number || ''} onChange={e => set('insurance_number', e.target.value)} /></label>
          <label>Taux prise en charge (%)<input type="number" value={form.insurance_rate || ''} onChange={e => set('insurance_rate', e.target.value)} /></label>
          <label>Montant assurance<input type="number" value={form.insurance_amount || ''} onChange={e => set('insurance_amount', e.target.value)} /></label>
        </div>

        <label>Notes<textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></label>

        <div className="actions">
          <button>{form.id ? 'Mettre à jour' : 'Enregistrer'}</button>
          {form.id && <button type="button" className="secondary" onClick={() => {setForm(initial); clearEdit && clearEdit();}}>Annuler modification</button>}
        </div>
      </form>
    </div>
  );
}

function SalesPage({ user, agencies, sales, refresh }) {
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('tous');
  const [search, setSearch] = useState('');

  const filtered = sales.filter(s => {
    const okStatus = filter === 'tous' || s.status === filter;
    const term = search.toLowerCase();
    const okSearch = !term || [s.client_name, s.client_phone, s.agency_name, s.sale_number].some(v => String(v || '').toLowerCase().includes(term));
    return okStatus && okSearch;
  });

  return (
    <section className="page">
      <SaleForm user={user} agencies={agencies} refresh={refresh} editing={editing} clearEdit={() => setEditing(null)} />
      <div className="panel">
        <div className="panel-head">
          <h2>Historique des ventes</h2>
          <div className="filters">
            <input placeholder="Rechercher client, téléphone..." value={search} onChange={e => setSearch(e.target.value)} />
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="tous">Tous</option>
              <option value="brouillon">Brouillons</option>
              <option value="en_attente">En attente</option>
              <option value="terminee">Terminées</option>
              <option value="annulee">Annulées</option>
            </select>
          </div>
        </div>
        <SalesTable sales={filtered} onEdit={setEditing} />
      </div>
    </section>
  );
}

function AgenciesPage({ agencies, refresh }) {
  const [form, setForm] = useState({ name: '', city: '', manager_name: '', phone: '' });

  async function submit(e) {
    e.preventDefault();
    await api('/api/agencies', { method: 'POST', body: JSON.stringify(form) });
    setForm({ name: '', city: '', manager_name: '', phone: '' });
    refresh();
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
          <button>Ajouter l’agence</button>
        </form>
      </div>
      <div className="panel">
        <h2>Agences</h2>
        <div className="cards-list">
          {agencies.map(a => <div className="list-card" key={a.id}><div><strong>{a.name}</strong><span>{a.city || ''} · {a.manager_name || 'Responsable non renseigné'}</span></div><button className={a.is_active ? 'success' : 'danger'} onClick={() => toggle(a)}>{a.is_active ? 'Active' : 'Inactive'}</button></div>)}
        </div>
      </div>
    </section>
  );
}

function UsersPage({ users, agencies, refresh }) {
  const [form, setForm] = useState({ full_name:'', email:'', password:'123456', role:'vendeur', agency_name:'Dori' });

  async function submit(e) {
    e.preventDefault();
    await api('/api/users', { method:'POST', body: JSON.stringify(form) });
    setForm({ full_name:'', email:'', password:'123456', role:'vendeur', agency_name:'Dori' });
    refresh();
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
            <option value="admin">Administrateur</option><option value="direction">Direction</option><option value="responsable_agence">Responsable agence</option><option value="vendeur">Vendeur</option><option value="comptable">Comptable</option>
          </select></label>
          <label>Agence<select value={form.agency_name} onChange={e => setForm({...form, agency_name:e.target.value})}>
            <option value="">Toutes agences</option>{agencies.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select></label>
          <button>Créer</button>
        </form>
      </div>
      <div className="panel">
        <h2>Utilisateurs</h2>
        <div className="cards-list">
          {users.map(u => <div className="list-card" key={u.id}><div><strong>{u.full_name}</strong><span>{u.email} · {u.role} · {u.agency_name || 'Toutes agences'}</span></div><button className={u.is_active ? 'success' : 'danger'} onClick={() => toggle(u)}>{u.is_active ? 'Actif' : 'Inactif'}</button></div>)}
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
      const [a,u,s] = await Promise.all([api('/api/agencies'), api('/api/users'), api('/api/sales')]);
      setAgencies(a.agencies || []);
      setUsers(u.users || []);
      setSales(s.sales || []);
    } catch (err) {
      alert('Erreur : ' + err.message + '. Ouvre /api/setup si nécessaire.');
    } finally { setLoading(false); }
  }

  useEffect(() => { loadAll(); }, [user]);

  if (!user) return <Login onLogin={setUser} />;

  const nav = [
    ['dashboard','Tableau de bord','📊'],
    ['sales','Ventes','🧾'],
    ['agencies','Agences','🏢'],
    ['users','Utilisateurs','👥'],
    ['stock','Stock','📦'],
    ['insurance','Assurances','🛡️'],
    ['reports','Rapports','📈'],
    ['settings','Paramètres','⚙️']
  ];

  return (
    <div className="app">
      <aside className={menuOpen ? 'open' : ''}>
        <div className="aside-head"><div className="brand-small">OM</div><div><h2>Optic Manager</h2><p>Saint Jean-Baptiste</p></div></div>
        <div className="user-box"><strong>{user.full_name}</strong><span>{user.role} · {user.agency_name || 'Toutes agences'}</span></div>
        <nav>{nav.map(n => <button key={n[0]} className={page===n[0]?'active':''} onClick={() => {setPage(n[0]); setMenuOpen(false)}}><span>{n[2]}</span>{n[1]}</button>)}</nav>
        <button className="logout" onClick={() => {localStorage.removeItem('optic_user'); setUser(null)}}>Déconnexion</button>
      </aside>

      <main>
        <header className="topbar">
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          <div><p className="eyebrow">ERP OPTIQUE</p><h1>{nav.find(n => n[0]===page)?.[1]}</h1></div>
          <button onClick={loadAll}>{loading ? '...' : 'Actualiser'}</button>
        </header>

        {page === 'dashboard' && <Dashboard sales={sales} agencies={agencies} users={users} />}
        {page === 'sales' && <SalesPage user={user} agencies={agencies} sales={sales} refresh={loadAll} />}
        {page === 'agencies' && <AgenciesPage agencies={agencies} refresh={loadAll} />}
        {page === 'users' && <UsersPage users={users} agencies={agencies} refresh={loadAll} />}
        {page === 'stock' && <Placeholder title="Stock" text="Prochaine version : montures, verres, lentilles, accessoires et inventaire." />}
        {page === 'insurance' && <Placeholder title="Assurances" text="La V3 enregistre déjà les informations d'assurance dans chaque vente." />}
        {page === 'reports' && <Placeholder title="Rapports" text="Prochaine étape : export et graphiques avancés." />}
        {page === 'settings' && <Placeholder title="Paramètres" text="Configuration des permissions et préférences." />}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
