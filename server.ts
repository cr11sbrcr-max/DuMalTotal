import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PHOTOS_FILE = path.join(__dirname, 'saved_photos.json');

app.use(express.json({ limit: '60mb' }));

// Health / status endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Download complete project ZIP for GitHub / Lovable
app.get(['/projeto-nicolly-caua.zip', '/api/download-zip'], (_req, res) => {
  const zipFile = path.join(__dirname, 'public', 'projeto-nicolly-caua.zip');
  if (fs.existsSync(zipFile)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="projeto-nicolly-caua.zip"');
    return res.sendFile(zipFile);
  }
  return res.status(404).json({ error: 'ZIP file not found' });
});

// GET saved photos
app.get('/api/photos', (_req, res) => {
  try {
    if (fs.existsSync(PHOTOS_FILE)) {
      const data = fs.readFileSync(PHOTOS_FILE, 'utf-8');
      return res.json({ success: true, photos: JSON.parse(data) });
    }
  } catch (err) {
    console.error('Error reading saved photos:', err);
  }
  return res.json({ success: true, photos: null });
});

// POST save photos
app.post('/api/photos', (req, res) => {
  try {
    const { photos } = req.body;
    if (Array.isArray(photos)) {
      fs.writeFileSync(PHOTOS_FILE, JSON.stringify(photos), 'utf-8');
      console.log(`Successfully saved ${photos.length} photos to server`);
      return res.json({ success: true, count: photos.length });
    }
    return res.status(400).json({ success: false, error: 'Invalid photos array' });
  } catch (err) {
    console.error('Error saving photos:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Applet server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
