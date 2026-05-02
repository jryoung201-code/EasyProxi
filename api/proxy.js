export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send("Missing URL");
  }

  try {
    const response = await fetch(url);
    const text = await response.text();
    res.status(200).send(text);
  } catch (err) {
    res.status(500).send("Proxy error");
  }
}
