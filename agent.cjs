const express = require('express');
const { exec } = require('child_process');
const basicAuth = require('express-basic-auth');

const app = express();
app.use(express.json());

const PORT = 3001;
const AUTH_USER = 'repulsr';
const AUTH_PASS = 'trilL0um';

let currentVolume = 50;
let isMuted = false;

app.use(basicAuth({
  users: { [AUTH_USER]: AUTH_PASS },
  challenge: true,
  unauthorizedResponse: 'Access Denied'
}));

const runPs = (script) => {
  return new Promise((resolve, reject) => {
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    exec(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
  });
};

app.get('/api/ping', (req, res) => res.json({ status: 'online' }));

app.get('/api/volume', (req, res) => {
  res.json({ volume: currentVolume, muted: isMuted });
});

app.post('/api/volume', async (req, res) => {
  try {
    const level = Math.max(0, Math.min(100, Number(req.body.level)));
    const steps = Math.round(level / 2);

    const psScript = `
      $obj = New-Object -ComObject WScript.Shell
      1..50 | ForEach-Object { $obj.SendKeys([char]174) }
      if (${steps} -gt 0) {
        1..${steps} | ForEach-Object { $obj.SendKeys([char]175) }
      }
    `;
    
    await runPs(psScript);
    currentVolume = level;
    res.json({ success: true, level: currentVolume });
  } catch (err) {
    res.status(500).json({ error: "Failed to set volume" });
  }
});

app.post('/api/volume/mute', async (req, res) => {
  try {
    const psScript = `
      $obj = New-Object -ComObject WScript.Shell
      $obj.SendKeys([char]173)
    `;
    await runPs(psScript);
    isMuted = !isMuted;
    res.json({ success: true, muted: isMuted });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle mute" });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AGENT RUNNING] Listening on port ${PORT}`);
});