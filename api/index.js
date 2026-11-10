require('dotenv').config();
const express = require('express');
const path = require('path');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Inisialisasi Firebase Admin SDK dari Environment Variable
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK berhasil diinisialisasi.');
} catch (error) {
  console.error('Gagal menginisialisasi Firebase Admin SDK:', error.message);
}

const db = admin.apps.length ? admin.firestore() : null;

app.use(express.json());
// Folder public ada di root project, bukan di dalam folder api
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Endpoint: Mendapatkan daftar menu kafe
app.get('/api/menu', (req, res) => {
  const menuList = [
    { id: 1, name: 'Espresso', price: 18000, category: 'Kopi' },
    { id: 2, name: 'Americano', price: 22000, category: 'Kopi' },
    { id: 3, name: 'Caffe Latte', price: 28000, category: 'Kopi' },
    { id: 4, name: 'Matcha Latte', price: 30000, category: 'Non-Kopi' },
    { id: 5, name: 'Croissant Butter', price: 25000, category: 'Makanan' }
  ];
  res.json({ success: true, data: menuList });
});

// API Endpoint: Simpan transaksi pesanan
app.post('/api/checkout', async (req, res) => {
  const { items, total } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Keranjang belanja kosong.' });
  }

  const transactionData = {
    items,
    total,
    createdAt: new Date().toISOString()
  };

  try {
    if (db) {
      const docRef = await db.collection('transactions').add(transactionData);
      return res.json({ success: true, id: docRef.id, message: 'Transaksi berhasil disimpan ke Firebase.' });
    } else {
      return res.json({ success: true, message: 'Transaksi berhasil di-process (Mode lokal tanpa database).' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Listener hanya dipakai saat dijalankan lokal, bukan di Vercel (serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server EPOS Kafe berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
