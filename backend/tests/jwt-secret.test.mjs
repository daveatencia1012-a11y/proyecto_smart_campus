import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const services = [
  'users-service',
  'requests-service',
  'reservations-service',
  'resources-service',
  'events-service',
  'notifications-service'
];

const jwtURL = import.meta.resolve('jsonwebtoken');
const probe = fileURLToPath(new URL('./fixtures/auth-probe.mjs', import.meta.url));

function runProbe(service, secret, scenario = 'startup') {
  const middlewareURL = new URL(
    `../services/${service}/src/middleware/auth.js`,
    import.meta.url
  ).href;

  return spawnSync(process.execPath, [probe, middlewareURL, jwtURL, scenario], {
    // No heredar secretos, NODE_OPTIONS ni configuracion dotenv del entorno.
    // Estas pruebas nunca leen .env ni necesitan MySQL o Docker.
    env: secret === undefined ? {} : { JWT_SECRET: secret },
    encoding: 'utf8',
    timeout: 15000
  });
}

for (const service of services) {
  describe(service, () => {
    const invalid = [
      ['ausente', undefined],
      ['vacia', ''],
      ['solo espacios', ' '.repeat(40)],
      ['menor de 32 bytes', 'a'.repeat(31)],
      ['UTF-8 menor de 32 bytes', 'ñ'.repeat(15)],
      ['fallback anterior', 'smart_campus_jwt_secret'],
      ['ejemplo de users', 'cambia_este_secreto'],
      ['ejemplo de reservations', 'your_jwt_secret_key_here'],
      ['ejemplo largo', 'reemplaza_por_una_cadena_larga_y_aleatoria'],
      ['ejemplo largo en mayusculas', 'REEMPLAZA_POR_UNA_CADENA_LARGA_Y_ALEATORIA'],
      ['espacio inicial', ` ${randomBytes(32).toString('hex')}`],
      ['espacio final', `${randomBytes(32).toString('hex')} `],
      ['salto de linea final', `${randomBytes(32).toString('hex')}\n`]
    ];

    for (const [name, secret] of invalid) {
      it(`rechaza clave ${name} sin mostrar su valor`, () => {
        const result = runProbe(service, secret);
        assert.ifError(result.error);
        assert.equal(result.status, 1);
        assert.equal(result.stdout, '');
        assert.match(result.stderr, /\[auth\] JWT_SECRET/);
        if (secret) {
          assert.ok(!result.stderr.includes(secret), 'El error expone la clave');
        }
      });
    }

    for (const [name, secret] of [
      ['limite de 32 bytes', randomBytes(16).toString('hex')],
      ['64 caracteres hexadecimales', randomBytes(32).toString('hex')],
      ['base64', randomBytes(32).toString('base64')],
      ['longitud UTF-8 medida en bytes', 'ñ'.repeat(16)]
    ]) {
      it(`acepta ${name}`, () => {
        const result = runProbe(service, secret);
        assert.ifError(result.error);
        assert.equal(result.status, 0, result.stderr);
        assert.equal(result.stdout, 'auth-ready\n');
        assert.ok(!result.stderr.includes(secret), 'El arranque expone la clave');
      });
    }

    it('verifica JWT y RBAC por HTTP con una clave de prueba aislada', () => {
      const result = runProbe(service, randomBytes(32).toString('hex'), 'http');
      assert.ifError(result.error);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, 'http-ok\n');
    });
  });
}

describe('configuracion versionada', () => {
  it('exige JWT_SECRET sin fallback en los seis servicios de Compose', () => {
    const compose = readFileSync(
      new URL('../docker-compose.yml', import.meta.url), 'utf8'
    );
    const declarations = [...compose.matchAll(/^ {6}JWT_SECRET: (.+)$/gm)];
    assert.equal(declarations.length, services.length);
    for (const [, value] of declarations) {
      assert.equal(value, '${JWT_SECRET:?Debes definir JWT_SECRET}');
    }
    assert.equal(
      [...compose.matchAll(/JWT_EXPIRES_IN: \$\{JWT_EXPIRES_IN:-15m\}/g)].length,
      services.length
    );
  });

  for (const path of [
    '../.env.example',
    '../services/users-service/.env.example',
    '../services/reservations-service/.env.example',
    '../services/notifications-service/.env.example'
  ]) {
    it(`${path} deja JWT_SECRET vacio y explica como generarlo`, () => {
      const example = readFileSync(new URL(path, import.meta.url), 'utf8');
      assert.match(example, /^JWT_SECRET=$/m);
      assert.equal([...example.matchAll(/^JWT_SECRET=/gm)].length, 1);
      assert.match(example, /openssl rand -hex 32/);
    });
  }
});
