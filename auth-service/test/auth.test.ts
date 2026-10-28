import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET as string;

const ADMIN = {
  name: 'Administrador',
  email: 'admin@test.com',
  password: 'secret123',
  role: 'admin' as const,
};

async function register(payload: Record<string, unknown>) {
  return request(app).post('/api/auth/register').send(payload);
}

async function createAndLogin(user = ADMIN) {
  const registration = await register(user);
  expect(registration.status).toBe(201);

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: user.password });

  expect(login.status).toBe(200);

  return {
    user: login.body.user,
    token: login.body.tokens.accessToken as string,
  };
}

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('health check', () => {
  it('responds without authentication', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.service).toBe('auth-service');
  });
});

describe('POST /api/auth/register', () => {
  it('registers an operator by default and never exposes the password hash', async () => {
    const response = await register({
      name: 'Operador Uno',
      email: 'operator@test.com',
      password: 'secret123',
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      name: 'Operador Uno',
      email: 'operator@test.com',
      role: 'operator',
      isActive: true,
    });
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicated emails', async () => {
    await register({ name: 'Admin', email: 'duplicate@test.com', password: 'secret123' });
    const response = await register({
      name: 'Otro',
      email: 'duplicate@test.com',
      password: 'secret123',
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/ya está registrado/i);
  });

  it('returns field level validation errors', async () => {
    const response = await register({ name: 'A', email: 'invalid', password: '123' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation error');
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'name' }),
        expect.objectContaining({ field: 'email' }),
        expect.objectContaining({ field: 'password' }),
      ]),
    );
  });
});

describe('POST /api/auth/login', () => {
  it('returns a signed JWT with identity and authorization claims', async () => {
    await register(ADMIN);
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN.email, password: ADMIN.password });

    expect(response.status).toBe(200);
    expect(response.body.tokens.expiresIn).toBe('1h');

    const payload = jwt.verify(response.body.tokens.accessToken, JWT_SECRET) as jwt.JwtPayload;
    expect(payload).toMatchObject({
      sub: response.body.user.id,
      email: ADMIN.email,
      role: 'admin',
      iss: 'auth-service',
      aud: 'business-service',
    });
    expect(typeof payload.exp).toBe('number');
  });

  it('rejects invalid credentials with the same message', async () => {
    await register(ADMIN);

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN.email, password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: ADMIN.password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it('blocks deactivated users and invalidates previously issued tokens', async () => {
    const operator = await createAndLogin({
      name: 'Operador',
      email: 'operator@test.com',
      password: 'secret123',
      role: 'operator',
    });
    const admin = await createAndLogin(ADMIN);

    const deactivation = await request(app)
      .patch(`/api/users/${operator.user.id}/deactivate`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(deactivation.status).toBe(200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operator@test.com', password: 'secret123' });
    expect(login.status).toBe(403);

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${operator.token}`);
    expect(me.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the authenticated user', async () => {
    const { user, token } = await createAndLogin(ADMIN);
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual(user);
  });

  it('rejects missing and tampered tokens', async () => {
    const missing = await request(app).get('/api/auth/me');
    const tampered = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(missing.status).toBe(401);
    expect(tampered.status).toBe(401);
  });

  it('rejects tokens signed with another algorithm or issuer', async () => {
    const wrongAlgorithm = jwt.sign(
      { sub: 'user-id', email: ADMIN.email, role: ADMIN.role },
      JWT_SECRET,
      {
        algorithm: 'HS512',
        expiresIn: '1h',
        issuer: 'auth-service',
        audience: 'business-service',
      },
    );
    const wrongIssuer = jwt.sign(
      { sub: 'user-id', email: ADMIN.email, role: ADMIN.role },
      JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: '1h',
        issuer: 'another-service',
        audience: 'business-service',
      },
    );

    const algorithmResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${wrongAlgorithm}`);
    const issuerResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${wrongIssuer}`);

    expect(algorithmResponse.status).toBe(401);
    expect(issuerResponse.status).toBe(401);
  });
});

describe('user administration', () => {
  it('allows only administrators to list users', async () => {
    const admin = await createAndLogin(ADMIN);
    const operator = await createAndLogin({
      name: 'Operador',
      email: 'operator@test.com',
      password: 'secret123',
      role: 'operator',
    });

    const adminResponse = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${admin.token}`);
    const operatorResponse = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${operator.token}`);
    const anonymousResponse = await request(app).get('/api/users');

    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.users).toHaveLength(2);
    expect(operatorResponse.status).toBe(403);
    expect(anonymousResponse.status).toBe(401);
  });

  it('updates roles and activation state', async () => {
    const admin = await createAndLogin(ADMIN);
    const operator = await createAndLogin({
      name: 'Operador',
      email: 'operator@test.com',
      password: 'secret123',
      role: 'operator',
    });

    const promotion = await request(app)
      .patch(`/api/users/${operator.user.id}/role`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: 'admin' });
    expect(promotion.status).toBe(200);
    expect(promotion.body.user.role).toBe('admin');

    const deactivation = await request(app)
      .patch(`/api/users/${operator.user.id}/deactivate`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(deactivation.status).toBe(200);
    expect(deactivation.body.user.isActive).toBe(false);

    const activation = await request(app)
      .patch(`/api/users/${operator.user.id}/activate`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(activation.status).toBe(200);
    expect(activation.body.user.isActive).toBe(true);
  });

  it('prevents an administrator from deactivating or demoting their own account', async () => {
    const admin = await createAndLogin(ADMIN);

    const deactivate = await request(app)
      .patch(`/api/users/${admin.user.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ isActive: false });
    const demote = await request(app)
      .patch(`/api/users/${admin.user.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: 'operator' });

    expect(deactivate.status).toBe(400);
    expect(demote.status).toBe(400);
  });

  it('validates user identifiers and duplicate emails', async () => {
    const admin = await createAndLogin(ADMIN);
    await createAndLogin({
      name: 'Operador',
      email: 'operator@test.com',
      password: 'secret123',
      role: 'operator',
    });

    const invalidId = await request(app)
      .get('/api/users/not-a-uuid')
      .set('Authorization', `Bearer ${admin.token}`);
    const duplicateEmail = await request(app)
      .patch(`/api/users/${admin.user.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email: 'operator@test.com' });

    expect(invalidId.status).toBe(400);
    expect(duplicateEmail.status).toBe(409);
  });
});
