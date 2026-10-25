import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { registerHooks } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

export async function startRoleStack({ port = 0 } = {}) {
  const name = `smart-campus-role-test-${randomBytes(5).toString('hex')}`;
  const services = ['users','requests','reservations','resources','events','notifications'];
  const env = { PATH:process.env.PATH, MYSQL_ROOT_PASSWORD:randomBytes(32).toString('hex') };
  for (const service of services) env[`${service.toUpperCase()}_DB_PASSWORD`] = randomBytes(32).toString('hex');
  const pools = {}, servers = [];
  let root, hook;
  const run = args => {
    const result = spawnSync('docker', args, { env, encoding:'utf8', timeout:120000 });
    assert.ifError(result.error); assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  async function close() {
    hook?.deregister();
    for (const server of [...servers].reverse()) {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
    await Promise.allSettled(Object.values(pools).map(pool => pool.end()));
    await root?.end().catch(() => {});
    spawnSync('docker', ['rm','-f',name], { env, encoding:'utf8' });
    delete globalThis.__roleTestPools;
  }
  try {
    const sql = fileURLToPath(new URL('../../sql/', import.meta.url));
    run(['run','--rm','-d','--name',name,'--tmpfs','/var/lib/mysql','-p','127.0.0.1::3306','-e','MYSQL_ROOT_PASSWORD','-e','MYSQL_ROOT_HOST=%',
      ...services.flatMap(service => ['-e',`${service.toUpperCase()}_DB_PASSWORD`]),
      '-v',`${sql}init.sql:/docker-entrypoint-initdb.d/init.sql:ro`,
      '-v',`${sql}migrations/002-role-interfaces.sql:/docker-entrypoint-initdb.d/zy-role-interfaces.sql:ro`,
      '-v',`${sql}provision-users.sh:/docker-entrypoint-initdb.d/zz-app-users.sh:ro`,'mysql:8.0']);
    const mysqlPort = Number(run(['port',name,'3306/tcp']).split(':').at(-1));
    for (let attempt = 0; attempt < 120; attempt++) {
      try {
        root = await mysql.createConnection({ host:'127.0.0.1', port:mysqlPort, user:'root', password:env.MYSQL_ROOT_PASSWORD, multipleStatements:true, dateStrings:true });
        await root.query('SELECT 1'); break;
      } catch { await root?.end().catch(() => {}); root = null; await delay(500); }
    }
    assert.ok(root, 'El MySQL efímero no arrancó');
    for (const service of services) pools[service] = mysql.createPool({ host:'127.0.0.1', port:mysqlPort, user:`campus_${service}`, password:env[`${service.toUpperCase()}_DB_PASSWORD`], database:`${service}_db`, dateStrings:true, stringifyObjects:true, connectionLimit:12 });
    globalThis.__roleTestPools = pools;
    process.env.JWT_SECRET = randomBytes(32).toString('hex');
    process.env.JWT_REFRESH_SECRET = randomBytes(32).toString('hex');
    process.env.JWT_EXPIRES_IN = '15m'; process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.INTERNAL_API_TOKEN = randomBytes(32).toString('hex');
    const dependencies = Object.fromEntries(['axios','bcrypt','jsonwebtoken','cors'].map(key => [key, import.meta.resolve(key)]));
    const express4 = import.meta.resolve('express4'), express5 = import.meta.resolve('express');
    const noDotenv = `data:text/javascript,${encodeURIComponent('export default {config(){return {parsed:{}}}}; export function config(){return {parsed:{}}}')}`;
    hook = registerHooks({ resolve(specifier, context, next) {
      if (specifier === 'dotenv') return { shortCircuit:true, url:noDotenv };
      if (specifier === 'dotenv/config') return { shortCircuit:true, url:'data:text/javascript,export {}' };
      if (specifier === 'express') return next(context.parentURL?.includes('/services/') && !context.parentURL.includes('/notifications-service/') ? express4 : express5, context);
      if (dependencies[specifier]) return next(dependencies[specifier], context);
      if (specifier === '../config/db.js' || specifier === './config/db.js') {
        const match = context.parentURL?.match(/\/services\/([^/]+)-service\//);
        if (match) return { shortCircuit:true, url:`data:text/javascript,${encodeURIComponent(`export const pool = globalThis.__roleTestPools[${JSON.stringify(match[1])}]; export default pool;`)}` };
      }
      return next(specifier, context);
    } });
    async function listen(app, preferred = 0) {
      const server = createServer(app); servers.push(server);
      await new Promise((resolve,reject) => { server.once('error',reject); server.listen(preferred,'127.0.0.1',resolve); });
      return `http://127.0.0.1:${server.address().port}`;
    }
    const urls = {};
    for (const service of ['notifications','resources','requests','reservations','events','users']) {
      const { default:app } = await import(`../../services/${service}-service/src/app.js`);
      urls[service] = await listen(app);
      process.env[`${service.toUpperCase()}_SERVICE_URL`] = urls[service];
    }
    const { createApp } = await import('../../src/app.js');
    const gateway = await listen(createApp({ services:urls }), port);
    process.env.GATEWAY_SERVICE_URL = gateway;
    const password = 'Role-test-password-2026';
    const hash = await bcrypt.hash(password, 4);
    const accounts = {};
    for (const key of ['estudiante','docente','administrativo','administrador','otro_estudiante']) {
      const rol = key === 'otro_estudiante' ? 'estudiante' : key;
      const email = `${key}@roles.example.test`;
      const [result] = await pools.users.execute('INSERT INTO users (nombre,email,password_hash,rol) VALUES (?, ?, ?, ?)', [key,email,hash,rol]);
      accounts[key] = { id:result.insertId, rol, email, password };
    }
    await root.execute('UPDATE users_db.users SET activo = 0 WHERE id = 1');
    return { gateway, urls, accounts, pools, root, close };
  } catch (error) { await close(); throw error; }
}
