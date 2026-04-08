import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDotabuffData } from './dotabuff.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../../public')));

app.get('/api/dotabuff', async (req, res) => {
  try {
    const data = await getDotabuffData();
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error fetching Dotabuff data' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.listen(port, () => {
  console.log(`Dotabuff app listening at http://localhost:${port}`);
});
