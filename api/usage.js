export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API key
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // In a real app, validate API key and store usage
  const { dataUsed, requests } = req.body;

  console.log(`Usage tracked: ${dataUsed} MB, ${requests} requests for API key: ${apiKey}`);

  res.status(200).json({ success: true, message: 'Usage tracked' });
}