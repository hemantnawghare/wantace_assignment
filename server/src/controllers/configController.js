export async function getConfigController(req, res) {
  res.json({ message: 'Active config endpoint available.' });
}

export async function updateConfigController(req, res) {
  res.json({ message: 'Config update endpoint available.' });
}
