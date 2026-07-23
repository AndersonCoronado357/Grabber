/**
 * Wrapper para comandos que exigen DATABASE_URL en el entorno (CLI de Prisma).
 * Compone la cadena en tiempo de ejecución y la inyecta SOLO en el proceso hijo;
 * nunca queda escrita en el .env ni en los scripts de package.json.
 *
 * Uso:
 *   tsx scripts/with-db-url.ts [--test] [--admin] -- <comando...>
 *
 *   --test   usa DB_NAME_TEST en lugar de DB_NAME
 *   --admin  usa autenticación integrada de Windows (para migraciones,
 *            porque grabber_app no tiene permisos DDL)
 */
import 'dotenv/config';
import { spawn } from 'node:child_process';

const argv = process.argv.slice(2);
const sep = argv.indexOf('--');
if (sep === -1 || sep === argv.length - 1) {
  console.error('Uso: tsx scripts/with-db-url.ts [--test] [--admin] -- <comando...>');
  process.exit(2);
}
const flags = argv.slice(0, sep);
const cmd = argv.slice(sep + 1);
const useTest = flags.includes('--test');
const useAdmin = flags.includes('--admin');

const host = process.env.DB_INSTANCE
  ? `${process.env.DB_HOST}\\${process.env.DB_INSTANCE}`
  : process.env.DB_PORT
    ? `${process.env.DB_HOST}:${process.env.DB_PORT}`
    : process.env.DB_HOST;
const dbName = useTest ? process.env.DB_NAME_TEST : process.env.DB_NAME;
const tail = `encrypt=${process.env.DB_ENCRYPT};trustServerCertificate=${process.env.DB_TRUST_SERVER_CERT}`;

// mismo escapado ADO.NET que src/config/env.ts: llaves, doblando '}' internos
const esc = (v: string) => '{' + v.replace(/\}/g, '}}') + '}';

const url = useAdmin
  ? `sqlserver://${host};database=${dbName};integratedSecurity=true;${tail}`
  : `sqlserver://${host};database=${dbName};user=${esc(process.env.DB_USER ?? '')};password=${esc(process.env.DB_PASSWORD ?? '')};${tail}`;

const child = spawn(cmd[0]!, cmd.slice(1), {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: url },
});
child.on('exit', (code) => process.exit(code ?? 1));
