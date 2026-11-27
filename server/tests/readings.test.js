const request = require('supertest');
const createApp = require('../src/app');

const app = createApp();
const TODAY = new Date().toISOString().slice(0, 10);

async function authUser(email) {
  const unique = email || `r${Date.now()}${Math.floor(Math.random() * 10000)}@example.com`;
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Reader', email: unique, password: 'Password123' });
  return { token: reg.body.data.token, email: unique };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('Reading validation', () => {
  test('1. Successful reading creation', async () => {
    const { token } = await authUser();
    const res = await request(app)
      .post('/api/readings')
      .set(authHeader(token))
      .send({ readingDate: TODAY, timeSlot: 'MORNING', value: 120 });
    expect(res.status).toBe(201);
    expect(res.body.data.value).toBe(120);
  });

  test('2. Empty value is rejected with exact message', async () => {
    const { token } = await authUser();
    const res = await request(app)
      .post('/api/readings')
      .set(authHeader(token))
      .send({ readingDate: TODAY, timeSlot: 'MORNING', value: '' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Please enter a glucose value.');
  });

  test('3. Value below 40 is rejected', async () => {
    const { token } = await authUser();
    const res = await request(app)
      .post('/api/readings')
      .set(authHeader(token))
      .send({ readingDate: TODAY, timeSlot: 'MORNING', value: 39 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Value must be between 40 and 600 mg/dl.');
  });

  test('4. Value above 600 is rejected', async () => {
    const { token } = await authUser();
    const res = await request(app)
      .post('/api/readings')
      .set(authHeader(token))
      .send({ readingDate: TODAY, timeSlot: 'MORNING', value: 601 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Value must be between 40 and 600 mg/dl.');
  });

  test('5. Decimal value is rejected', async () => {
    const { token } = await authUser();
    const res = await request(app)
      .post('/api/readings')
      .set(authHeader(token))
      .send({ readingDate: TODAY, timeSlot: 'MORNING', value: 120.5 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Value must be between 40 and 600 mg/dl.');
  });

  test('6. Duplicate slot per day is rejected', async () => {
    const { token } = await authUser();
    await request(app)
      .post('/api/readings')
      .set(authHeader(token))
      .send({ readingDate: TODAY, timeSlot: 'AFTER_LUNCH', value: 145 });
    const res = await request(app)
      .post('/api/readings')
      .set(authHeader(token))
      .send({ readingDate: TODAY, timeSlot: 'AFTER_LUNCH', value: 150 });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/After lunch/i);
  });

  test('7. Maximum four readings per day', async () => {
    const { token } = await authUser();
    const slots = ['MORNING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'];
    for (const s of slots) {
      await request(app)
        .post('/api/readings')
        .set(authHeader(token))
        .send({ readingDate: TODAY, timeSlot: s, value: 120 });
    }
    // 4 already exist; further insert on same date must fail (try update path via duplicate)
    const res = await request(app)
      .post('/api/readings')
      .set(authHeader(token))
      .send({ readingDate: TODAY, timeSlot: 'MORNING', value: 130 });
    expect([400, 409]).toContain(res.status);
  });

  test('8. Future date is rejected', async () => {
    const { token } = await authUser();
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const res = await request(app)
      .post('/api/readings')
      .set(authHeader(token))
      .send({ readingDate: tomorrow, timeSlot: 'MORNING', value: 120 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Date cannot be in the future.');
  });

  test('9. Ownership is enforced', async () => {
    const a = await authUser();
    const b = await authUser();
    const created = await request(app)
      .post('/api/readings')
      .set(authHeader(a.token))
      .send({ readingDate: TODAY, timeSlot: 'MORNING', value: 120 });
    const id = created.body.data.id;
    const get = await request(app).get(`/api/readings/${id}`).set(authHeader(b.token));
    expect(get.status).toBe(404);
    const del = await request(app).delete(`/api/readings/${id}`).set(authHeader(b.token));
    expect(del.status).toBe(404);
  });

  test('10. Successful reading update', async () => {
    const { token } = await authUser();
    const created = await request(app)
      .post('/api/readings')
      .set(authHeader(token))
      .send({ readingDate: TODAY, timeSlot: 'MORNING', value: 120 });
    const res = await request(app)
      .put(`/api/readings/${created.body.data.id}`)
      .set(authHeader(token))
      .send({ readingDate: TODAY, timeSlot: 'MORNING', value: 135 });
    expect(res.status).toBe(200);
    expect(res.body.data.value).toBe(135);
  });

  test('11. Successful reading deletion', async () => {
    const { token } = await authUser();
    const created = await request(app)
      .post('/api/readings')
      .set(authHeader(token))
      .send({ readingDate: TODAY, timeSlot: 'MORNING', value: 120 });
    const res = await request(app)
      .delete(`/api/readings/${created.body.data.id}`)
      .set(authHeader(token));
    expect(res.status).toBe(200);
  });
});
