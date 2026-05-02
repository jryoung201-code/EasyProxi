export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uptime = process.uptime();
  const status = 'online';

  res.status(200).json({
    status,
    uptime: Math.floor(uptime),
    timestamp: new Date().toISOString()
  });
}