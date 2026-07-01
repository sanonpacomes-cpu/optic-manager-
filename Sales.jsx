import { agencies, saleTypes } from './demoData';

export default function Sales({ sales, setSales, user }) {
  function addSale(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const sale = Object.fromEntries(f.entries());
    setSales([{ ...sale, id: crypto.randomUUID(), seller: user.name, date: sale.date || new Date().toISOString().slice(0,10) }, ...sales]);
    e.currentTarget.reset();
  }
  return <div className="page"><h2>Ventes</h2><section className="panel"><h3>Enregistrer une vente</h3><form className="gridForm" onSubmit={addSale}><label>Date<input name="date" type="date" defaultValue={new Date().toISOString().slice(0,10)} /></label><label>Agence<select name="agency" defaultValue={user.role === 'vendeuse' ? user.agency : agencies[0]}>{agencies.map(a => <option key={a}>{a}</option>)}</select></label><label>Nom du client<input name="client" placeholder="Nom complet" required /></label><label>Téléphone<input name="phone" placeholder="+226..." /></label><label>Type de vente<select name="type">{saleTypes.map(t => <option key={t}>{t}</option>)}</select></label><label>Montant FCFA<input name="amount" type="number" min="0" required /></label><label>Scan ordonnance<input name="prescription" type="file" accept="image/*,.pdf" /></label><label>Scan reçu<input name="receipt" type="file" accept="image/*,.pdf" /></label><label className="full">Observation<textarea name="note" placeholder="Détails, acompte, reste à payer..."></textarea></label><button className="primary">Enregistrer</button></form></section><section className="panel"><h3>Historique des ventes</h3><div className="tableWrap"><table><thead><tr><th>Date</th><th>Agence</th><th>Client</th><th>Type</th><th>Vendeuse</th><th>Montant</th></tr></thead><tbody>{sales.map(s => <tr key={s.id}><td>{s.date}</td><td>{s.agency}</td><td>{s.client}</td><td>{s.type}</td><td>{s.seller}</td><td>{Number(s.amount).toLocaleString()} FCFA</td></tr>)}</tbody></table></div></section></div>
}
