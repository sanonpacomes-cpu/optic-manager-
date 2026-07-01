import { Eye } from 'lucide-react';
import { demoUsers } from "./demoData";

export default function Login({ onLogin }) {
  function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get('email');
    const password = form.get('password');
    const user = demoUsers.find(u => u.email === email && u.password === password);
    if (!user) return alert('Identifiants incorrects');
    onLogin(user);
  }

  return (
    <main className="loginPage">
      <section className="loginCard">
        <div className="loginLogo"><Eye size={38}/></div>
        <p className="eyebrow">ERP des agences optiques</p>
        <h1>Connexion à Optic Manager</h1>
        <p className="muted">Suivi des ventes, reçus, ordonnances, assurances et performances des agences.</p>
        <form onSubmit={handleSubmit}>
          <label>Email<input name="email" type="email" defaultValue="admin@optic.com" required /></label>
          <label>Mot de passe<input name="password" type="password" defaultValue="admin123" required /></label>
          <button className="primary">Se connecter</button>
        </form>
        <div className="demoBox">Admin : admin@optic.com / admin123<br/>Vendeuse : vendeuse@optic.com / vente123</div>
      </section>
    </main>
  );
}
