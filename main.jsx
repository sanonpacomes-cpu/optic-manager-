import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart3, Building2, FileText, LogOut, Plus, Receipt, ShieldCheck, ShoppingCart, Trash2, Users } from 'lucide-react';
import './style.css';

const AGENCIES = ['Dori', 'Somgandé', 'Kamsonghin', 'Tengandgo', 'Kaya', 'Bobo', 'Banfora', 'Goughin'];
const USERS = [
  { email: 'admin@optic.com', password: 'admin123', role: 'ADMINISTRATION', name: 'Administration' },
  { email: 'vendeuse@optic.com', password: 'vente123', role: 'VENDEUSE', name: 'Vendeuse' },
];

const initialSales = [
  { id: crypto.randomUUID(), date: new Date().toISOString().slice(0,10), agency: 'Dori', clientName: 'Client comptoir', phone: '—', product: 'Monture + verres unifocaux', amount: 29000, paymentMethod: 'Espèces', insurance: false, receiptNumber: 'REC-001', prescriptionFile: '', receiptFile: '', seller: 'Vendeuse' },
  { id: crypto.randomUUID(), date: new Date().toISOString().slice(0,10), agency: 'Kaya', clientName: 'Assuré exemple', phone: '—', product: 'Progressifs + monture', amount: 59000, paymentMethod: 'Assurance', insurance: true, insuranceCompany: 'Assurance Santé', receiptNumber: 'REC-002', prescriptionFile: '', receiptFile: '', seller: 'Administration' },
];

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });
  const update = (next) => {
    const nextValue = typeof next === 'function' ? next(value) : next;
    setValue(nextValue);
    localStorage.setItem(key, JSON.stringify(nextValue));
  };
  return [value, update];
}

function money(value) {
  return new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';
}

function fileToBase64(file) {
  return new Promise((resolve) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function App() {
  const [currentUser, setCurrentUser] = useLocalStorage('optic-user', null);
  const [sales, setSales] = useLocalStorage('optic-sales', initialSales);
  const [page, setPage] = useState('dashboard');
  const [filterAgency, setFilterAgency] = useState('Toutes');

  if (!currentUser) return <Login onLogin={setCurrentUser} />;

  const isAdmin = currentUser.role === 'ADMINISTRATION';
  const visibleSales = isAdmin ? sales : sales.filter(s => s.seller === currentUser.name);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><div className="logo">OM</div><div><h1>Optic Manager</h1><p>Gestion des agences optiques</p></div></div>
        <NavButton icon={<BarChart3/>} label="Tableau de bord" active={page==='dashboard'} onClick={()=>setPage('dashboard')} />
        <NavButton icon={<Plus/>} label="Nouvelle vente" active={page==='newSale'} onClick={()=>setPage('newSale')} />
        <NavButton icon={<ShoppingCart/>} label="Ventes" active={page==='sales'} onClick={()=>setPage('sales')} />
        <NavButton icon={<ShieldCheck/>} label="Assurances" active={page==='insurance'} onClick={()=>setPage('insurance')} />
        <NavButton icon={<Receipt/>} label="Reçus" active={page==='receipts'} onClick={()=>setPage('receipts')} />
        <button className="logout" onClick={() => setCurrentUser(null)}><LogOut size={18}/> Déconnexion</button>
      </aside>

      <main className="main">
        <header className="topbar"><div><h2>{titleFor(page)}</h2><p>Connecté : {currentUser.name} — {currentUser.role}</p></div></header>
        {page === 'dashboard' && <Dashboard sales={visibleSales} filterAgency={filterAgency} setFilterAgency={setFilterAgency} isAdmin={isAdmin} />}
        {page === 'newSale' && <SaleForm currentUser={currentUser} setSales={setSales} />}
        {page === 'sales' && <SalesTable sales={visibleSales} setSales={setSales} canDelete={isAdmin} />}
        {page === 'insurance' && <SalesTable sales={visibleSales.filter(s=>s.insurance)} setSales={setSales} canDelete={isAdmin} insuranceMode />}
        {page === 'receipts' && <Receipts sales={visibleSales} />}
      </main>
    </div>
  );
}

function titleFor(page) {
  return { dashboard:'Tableau de bord', newSale:'Enregistrer une vente', sales:'Toutes les ventes', insurance:'Clients avec assurance', receipts:'Reçus enregistrés' }[page];
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@optic.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    const user = USERS.find(u => u.email === email && u.password === password);
    if (!user) return setError('Email ou mot de passe incorrect.');
    onLogin(user);
  }

  return <div className="loginPage"><form className="loginCard" onSubmit={submit}>
    <div className="loginLogo">OM</div><h1>Optic Manager</h1><p>Suivi des ventes, agences, reçus, ordonnances et assurances.</p>
    <label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} />
    <label>Mot de passe</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
    {error && <div className="error">{error}</div>}
    <button className="primary">Se connecter</button>
    <div className="demo"><b>Comptes test :</b><br/>Admin : admin@optic.com / admin123<br/>Vendeuse : vendeuse@optic.com / vente123</div>
  </form></div>;
}

function NavButton({icon,label,active,onClick}) { return <button className={'nav '+(active?'active':'')} onClick={onClick}>{React.cloneElement(icon,{size:18})}{label}</button>; }

function Dashboard({ sales, filterAgency, setFilterAgency, isAdmin }) {
  const filtered = filterAgency === 'Toutes' ? sales : sales.filter(s=>s.agency===filterAgency);
  const today = new Date().toISOString().slice(0,10);
  const total = filtered.reduce((a,s)=>a+Number(s.amount),0);
  const todayTotal = filtered.filter(s=>s.date===today).reduce((a,s)=>a+Number(s.amount),0);
  const insuranceTotal = filtered.filter(s=>s.insurance).reduce((a,s)=>a+Number(s.amount),0);
  const byAgency = AGENCIES.map(agency => ({ agency, total: sales.filter(s=>s.agency===agency).reduce((a,s)=>a+Number(s.amount),0), count: sales.filter(s=>s.agency===agency).length })).sort((a,b)=>b.total-a.total);
  const max = Math.max(1, ...byAgency.map(a=>a.total));

  return <section>
    {isAdmin && <div className="filter"><Building2 size={18}/><select value={filterAgency} onChange={e=>setFilterAgency(e.target.value)}><option>Toutes</option>{AGENCIES.map(a=><option key={a}>{a}</option>)}</select></div>}
    <div className="cards">
      <Stat title="CA total" value={money(total)} icon={<BarChart3/>}/>
      <Stat title="CA du jour" value={money(todayTotal)} icon={<ShoppingCart/>}/>
      <Stat title="Nombre de ventes" value={filtered.length} icon={<Users/>}/>
      <Stat title="Ventes assurance" value={money(insuranceTotal)} icon={<ShieldCheck/>}/>
    </div>
    <div className="panel"><h3>Performance par agence</h3>{byAgency.map(a=><div className="barRow" key={a.agency}><span>{a.agency}</span><div className="bar"><i style={{width:`${(a.total/max)*100}%`}} /></div><b>{money(a.total)}</b></div>)}</div>
  </section>;
}

function Stat({title,value,icon}) { return <div className="stat"><div>{React.cloneElement(icon,{size:24})}</div><p>{title}</p><h3>{value}</h3></div>; }

function SaleForm({ currentUser, setSales }) {
  const [form, setForm] = useState({ date:new Date().toISOString().slice(0,10), agency:AGENCIES[0], clientName:'', phone:'', product:'', amount:'', paymentMethod:'Espèces', insurance:false, insuranceCompany:'', receiptNumber:'' });
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [saved, setSaved] = useState(false);

  const update = (key, value) => setForm({...form, [key]: value});
  async function submit(e) {
    e.preventDefault();
    const sale = { ...form, id: crypto.randomUUID(), amount:Number(form.amount), prescriptionFile: await fileToBase64(prescriptionFile), receiptFile: await fileToBase64(receiptFile), seller: currentUser.name };
    setSales(prev => [sale, ...prev]);
    setSaved(true);
    setForm({ date:new Date().toISOString().slice(0,10), agency:AGENCIES[0], clientName:'', phone:'', product:'', amount:'', paymentMethod:'Espèces', insurance:false, insuranceCompany:'', receiptNumber:'' });
    setPrescriptionFile(null); setReceiptFile(null);
  }

  return <form className="panel form" onSubmit={submit}>
    {saved && <div className="success">Vente enregistrée avec succès.</div>}
    <div className="grid"><Field label="Date"><input type="date" required value={form.date} onChange={e=>update('date',e.target.value)}/></Field>
    <Field label="Agence"><select value={form.agency} onChange={e=>update('agency',e.target.value)}>{AGENCIES.map(a=><option key={a}>{a}</option>)}</select></Field>
    <Field label="Nom du client"><input required value={form.clientName} onChange={e=>update('clientName',e.target.value)}/></Field>
    <Field label="Téléphone"><input value={form.phone} onChange={e=>update('phone',e.target.value)}/></Field>
    <Field label="Produit vendu"><input required placeholder="Monture, unifocaux, progressifs..." value={form.product} onChange={e=>update('product',e.target.value)}/></Field>
    <Field label="Montant"><input required type="number" value={form.amount} onChange={e=>update('amount',e.target.value)}/></Field>
    <Field label="Mode de paiement"><select value={form.paymentMethod} onChange={e=>update('paymentMethod',e.target.value)}><option>Espèces</option><option>Mobile Money</option><option>Carte bancaire</option><option>Assurance</option><option>Crédit client</option></select></Field>
    <Field label="N° reçu"><input value={form.receiptNumber} onChange={e=>update('receiptNumber',e.target.value)}/></Field>
    <Field label="Scan ordonnance"><input type="file" accept="image/*,.pdf" onChange={e=>setPrescriptionFile(e.target.files[0])}/></Field>
    <Field label="Scan reçu"><input type="file" accept="image/*,.pdf" onChange={e=>setReceiptFile(e.target.files[0])}/></Field></div>
    <label className="check"><input type="checkbox" checked={form.insurance} onChange={e=>update('insurance',e.target.checked)}/> Client avec assurance</label>
    {form.insurance && <Field label="Nom de l'assurance"><input value={form.insuranceCompany} onChange={e=>update('insuranceCompany',e.target.value)}/></Field>}
    <button className="primary">Enregistrer la vente</button>
  </form>;
}
function Field({label, children}) { return <label className="field"><span>{label}</span>{children}</label>; }

function SalesTable({ sales, setSales, canDelete, insuranceMode }) {
  function remove(id) { if(confirm('Supprimer cette vente ?')) setSales(prev=>prev.filter(s=>s.id!==id)); }
  return <div className="panel"><h3>{insuranceMode ? 'Dossiers assurance' : 'Liste des ventes'}</h3><div className="tableWrap"><table><thead><tr><th>Date</th><th>Agence</th><th>Client</th><th>Produit</th><th>Montant</th><th>Paiement</th><th>Preuves</th><th></th></tr></thead><tbody>{sales.map(s=><tr key={s.id}><td>{s.date}</td><td>{s.agency}</td><td>{s.clientName}<br/><small>{s.phone}</small>{s.insurance && <em>Assurance : {s.insuranceCompany || 'Oui'}</em>}</td><td>{s.product}</td><td><b>{money(s.amount)}</b></td><td>{s.paymentMethod}</td><td><Proof sale={s}/></td><td>{canDelete && <button className="danger" onClick={()=>remove(s.id)}><Trash2 size={16}/></button>}</td></tr>)}</tbody></table></div>{sales.length===0 && <p className="empty">Aucune donnée enregistrée.</p>}</div>;
}

function Proof({ sale }) {
  return <div className="proofs">{sale.prescriptionFile && <a href={sale.prescriptionFile} target="_blank">Ordonnance</a>}{sale.receiptFile && <a href={sale.receiptFile} target="_blank">Reçu</a>}{!sale.prescriptionFile && !sale.receiptFile && <small>Aucun fichier</small>}</div>;
}

function Receipts({ sales }) {
  const receipts = sales.filter(s=>s.receiptNumber || s.receiptFile);
  return <div className="panel"><h3>Reçus</h3><div className="receiptGrid">{receipts.map(s=><div className="receiptCard" key={s.id}><FileText size={22}/><h4>{s.receiptNumber || 'Reçu sans numéro'}</h4><p>{s.clientName} — {s.agency}</p><b>{money(s.amount)}</b>{s.receiptFile && <a href={s.receiptFile} target="_blank">Voir le scan</a>}</div>)}</div>{receipts.length===0 && <p className="empty">Aucun reçu enregistré.</p>}</div>;
}

createRoot(document.getElementById('root')).render(<App />);
