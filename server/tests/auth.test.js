const request = require('supertest');
const createApp = require('../src/app');

const app = createApp();

async function registerUser(overrides = {}) {
  const payload = {
    name: 'Test User',
    email: `test${Date.now()}${Math.floor(Math.random() * 10000)}@example.com`,
    password: 'Password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return { payload, res };
}

describe('Authentication', () => {
  test('1. Successful registration returns user + token', async () => {
    const { res } = await registerUser({ email: 'reg1@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('reg1@example.com');
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('2. Duplicate email is rejected', async () => {
    await registerUser({ email: 'dup@example.com' });
    const { res } = await registerUser({ email: 'dup@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('3. Successful login returns token', async () => {
    await registerUser({ email: 'login1@example.com', password: 'Password123' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login1@example.com', password: 'Password123' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  test('4. Incorrect password is rejected', async () => {
    await registerUser({ email: 'login2@example.com', password: 'Password123' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login2@example.com', password: 'wrongpass1' });
    expect(res.status).toBe(401);
  });

  test('5. Protected endpoint without token is rejected', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    const res2 = await request(app).get('/api/readings');
    expect(res2.status).toBe(401);
  });
});
