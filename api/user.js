export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API key
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // Mock user data
  const mockUser = {
    id: 'user-123',
    username: 'easyproxi-user',
    email: 'user@easyproxi.local',
    plan: 'free',
    dataLimit: 500,
    createdAt: '2024-01-01T00:00:00Z'
  };

  res.status(200).json(mockUser);
}