import { Building2, CalendarDays, TrendingUp, Wallet } from 'lucide-react';

export default function Dashboard({ sales }) {
  const total = sales.reduce((s, v) => s + Number(v.amount || 0), 0);
  const today = new Date().toISOString().slice(0,10);
  const todayTotal = sales.filter(v => v.date === today).reduce((s, v) => s + Number(v.amount || 0), 0);
  const bestAgency = Object.entries(sales.reduce((acc, v) => { acc[v.agency] = (acc[v.agency] || 0) + Number(v.amount); return acc; }, {})).sort((a,b) => b[1]-a[1])[0];
  const cards = [
    { label: 'CA total', value: `${total.toLocaleString()} FCFA`, icon: Wallet },
    { label: 'CA du jour', value: `${todayTotal.toLocaleString()} FCFA`, icon: CalendarDays },
    { label: 'Nombre de ventes', value: sales.length, icon: TrendingUp },
    { label: 'Meilleure agence', value: bestAgency ? bestAgency[0] : '-', icon: Building2 },
  ];
  return <div className="page"><h2>Tableau de bord</h2><div className="cards">{cards.map(c => { const Icon = c.icon; return <article className="card" key={c.label}><Icon/><span>{c.label}</span><strong>{c.value}</strong></article>})}</div><section className="panel"><h3>Dernières ventes</h3><div className="tableWrap"><table><thead><tr><th>Date</th><th>Agence</th><th>Client</th><th>Type</th><th>Montant</th></tr></thead><tbody>{sales.slice(0,8).map(s => <tr key={s.id}><td>{s.date}</td><td>{s.agency}</td><td>{s.client}</td><td>{s.type}</td><td>{Number(s.amount).toLocaleString()} FCFA</td></tr>)}</tbody></table></div></section></div>
}
