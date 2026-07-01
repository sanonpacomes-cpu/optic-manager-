import { getSql } from './db.js';

export default async function handler(req, res) {
  try {
    const sql = getSql();

    if (req.method === 'GET') {
      const sales = await sql`SELECT * FROM sales ORDER BY created_at DESC LIMIT 300`;
      return res.status(200).json({ sales });
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      const rows = await sql`INSERT INTO sales
        (agency_name, seller_email, client_name, client_phone, product_type, total_amount, paid_amount, is_insured, insurance_company, notes)
        VALUES
        (${b.agency_name}, ${b.seller_email || null}, ${b.client_name}, ${b.client_phone || null}, ${b.product_type}, ${Number(b.total_amount || 0)}, ${Number(b.paid_amount || 0)}, ${!!b.is_insured}, ${b.insurance_company || null}, ${b.notes || null})
        RETURNING *`;
      return res.status(201).json({ sale: rows[0] });
    }

    res.status(405).json({ error:'Méthode non autorisée' });
  } catch (error) {
    res.status(500).json({ error:error.message });
  }
}
