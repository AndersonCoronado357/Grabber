import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { auth, makeApp, prisma, registerAndLogin, resetDb, type App } from './helpers.js';

let app: App;

beforeAll(async () => {
  app = await makeApp();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});
beforeEach(resetDb);

describe('registro y login', () => {
  it('registra, exige verificación y luego inicia sesión', async () => {
    const reg = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'nueva@test.local', username: 'nueva', password: 'Segura#12345' },
    });
    expect(reg.statusCode).toBe(201);
    expect(reg.json().verificationRequired).toBe(true);

    // el código quedó persistido (hasheado); verificamos por la vía real
    const user = await prisma.user.findUniqueOrThrow({ where: { Email: 'nueva@test.local' } });
    expect(user.EmailVerifiedAt).toBeNull();
    const codeRow = await prisma.emailVerificationCode.findFirstOrThrow({ where: { UserId: user.Id } });
    expect(codeRow.CodeHash).toHaveLength(64);

    // login funciona aun sin verificar (la verificación desbloquea la sesión vía verify-email)
    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'nueva@test.local', password: 'Segura#12345' },
    });
    expect(login.statusCode).toBe(200);
    expect(login.json().accessToken).toBeTruthy();
    expect(login.json().user.username).toBe('nueva');
    expect(login.cookies.some((c) => c.name === 'grabber_refresh' && c.httpOnly)).toBe(true);
  });

  it('rechaza credenciales incorrectas con el código del catálogo', async () => {
    await registerAndLogin(app, { email: 'x@test.local', username: 'equisuser', password: 'Segura#12345' });
    const bad = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'x@test.local', password: 'Incorrecta#99' },
    });
    expect(bad.statusCode).toBe(401);
    expect(bad.json().error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rechaza correo y username duplicados', async () => {
    await registerAndLogin(app, { email: 'dup@test.local', username: 'duplicado' });
    const byEmail = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'dup@test.local', username: 'otronombre', password: 'Segura#12345' },
    });
    expect(byEmail.json().error.code).toBe('EMAIL_TAKEN');
    const byUser = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'otra@test.local', username: 'duplicado', password: 'Segura#12345' },
    });
    expect(byUser.json().error.code).toBe('USERNAME_TAKEN');
  });
});

describe('rotación de refresh', () => {
  it('rota el token y detecta reutilización revocando la familia', async () => {
    const { cookie } = await registerAndLogin(app);

    // primera rotación: OK y entrega cookie nueva
    const r1 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: { grabber_refresh: cookie },
    });
    expect(r1.statusCode).toBe(200);
    const newCookie = r1.cookies.find((c) => c.name === 'grabber_refresh')!.value;
    expect(newCookie).not.toBe(cookie);

    // reutilizar el token viejo dispara la detección
    const reuse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: { grabber_refresh: cookie },
    });
    expect(reuse.statusCode).toBe(401);
    expect(reuse.json().error.code).toBe('INVALID_TOKEN');

    // y toda la familia quedó revocada: el token nuevo tampoco sirve ya
    const afterReuse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: { grabber_refresh: newCookie },
    });
    expect(afterReuse.statusCode).toBe(401);
  });

  it('logout revoca la sesión', async () => {
    const { accessToken, cookie } = await registerAndLogin(app);
    const out = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: auth(accessToken) });
    expect(out.statusCode).toBe(200);
    const refresh = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: { grabber_refresh: cookie },
    });
    expect(refresh.statusCode).toBe(401);
  });
});
