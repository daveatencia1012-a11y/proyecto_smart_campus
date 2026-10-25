import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { registerHooks } from 'node:module';

const [middlewareURL, jwtURL, scenario] = process.argv.slice(2);

// Solo para pruebas: usar jsonwebtoken de devDependencies sin instalar los
// otros paquetes de los seis servicios ni cargar dotenv o acceder a MySQL.
registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === 'jsonwebtoken' ? jwtURL : specifier, context);
  }
});

const { authenticate, authorize } = await import(middlewareURL);

if (scenario === 'startup') {
  process.stdout.write('auth-ready\n');
} else if (scenario === 'http') {
  const { default: jwt } = await import(jwtURL);
  const server = createServer((req, res) => {
    res.status = code => {
      res.statusCode = code;
      return res;
    };
    res.json = body => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
      return res;
    };

    authenticate(req, res, () => {
      const respond = () => res.json({ usuario: req.user });
      if (req.url === '/admin') {
        authorize('administrador')(req, res, respond);
      } else {
        respond();
      }
    });
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const request = async (path, token, expectedStatus) => {
      const response = await fetch(`${base}${path}`, {
        headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(3000)
      });
      const body = await response.json();
      assert.equal(response.status, expectedStatus);
      return body;
    };

    await request('/', undefined, 401);
    await request('/', 'token-invalido', 401);

    const admin = { id: 1, rol: 'administrador', email: 'admin@example.test' };
    const sign = (payload, secret = process.env.JWT_SECRET, expiresIn = '15m') =>
      jwt.sign({ ...payload, token_use: 'access' }, secret, {
        expiresIn, issuer: 'smart-campus-users', audience: 'smart-campus-api'
      });

    await request('/', sign(admin, 'smart_campus_jwt_secret'), 401);
    await request('/', sign(admin, randomBytes(32).toString('hex')), 401);
    await request('/', sign(admin, process.env.JWT_SECRET, -1), 401);
    await request('/', sign({ ...admin, token_use: 'refresh', rol: undefined }), 401);
    await request('/', jwt.sign({ ...admin, token_use: 'refresh' }, process.env.JWT_SECRET, {
      expiresIn: '7d', issuer: 'smart-campus-users', audience: 'smart-campus-refresh'
    }), 401);
    await request('/', jwt.sign({ ...admin, token_use: 'refresh' }, process.env.JWT_SECRET, {
      expiresIn: '7d', issuer: 'smart-campus-users', audience: 'smart-campus-api'
    }), 401);
    await request('/', jwt.sign(admin, process.env.JWT_SECRET, { expiresIn: '15m' }), 401);

    for (const rol of ['estudiante', 'docente', 'administrativo', 'administrador']) {
      const payload = { id: 7, rol, email: `${rol}@example.test` };
      const token = sign(payload);
      const body = await request('/', token, 200);
      assert.deepEqual(body.usuario, payload);
      await request('/admin', token, rol === 'administrador' ? 200 : 403);
    }

    process.stdout.write('http-ok\n');
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
} else {
  throw new Error('Escenario de prueba desconocido');
}
