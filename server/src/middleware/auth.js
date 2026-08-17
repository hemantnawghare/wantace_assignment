import jwt from 'jsonwebtoken';

export function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || ' ';
  const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'northline-dev-secret');
      if (payload.role === 'admin') {
        req.user = { username: payload.username, role: payload.role };
        return next();
      }
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  const cookieHeader = req.headers.cookie || '';
  const hasSessionCookie = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .some((item) => item.startsWith('northline_admin=authenticated'));

  if (hasSessionCookie) {
    req.user = { username: process.env.ADMIN_USERNAME || 'admin', role: 'admin' };
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Owner Panel"');
    return res.status(401).json({ error: 'Authentication required' });
  }

  const encoded = authHeader.replace('Basic ', '');
  let decoded;

  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf-8');
  } catch (error) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Owner Panel"');
    return res.status(401).json({ error: 'Invalid authentication header' });
  }

  const [username, password] = decoded.split(':');
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'roofing2026!';

  if (username === adminUser && password === adminPass) {
    req.user = { username, role: 'admin' };
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Owner Panel"');
  return res.status(401).json({ error: 'Invalid credentials' });
}
