const request = require('supertest');
const createApp = require('../src/app');

const app = createApp();

async function authUser(email) {
  const unique = email || `rep${Date.now()}${Math.floor(Math.random() * 100000)}@example.com`;
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Reporter', email: unique, password: 'Password123' });
  return { token: reg.body.data.token };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('Reports', () => {
  test('1-4. Correct daily report with avg rounded to 1 decimal', async () => {
    const { token } = await authUser();
    const date = '2026-10-15';
    await request(app).post('/api/readings').set(authHeader(token)).send({ readingDate: date, timeSlot: 'MORNING', value: 100 });
    await request(app).post('/api/readings').set(authHeader(token)).send({ readingDate: date, timeSlot: 'AFTER_BREAKFAST', value: 141 });
    await request(app).post('/api/readings').set(authHeader(token)).send({ readingDate: date, timeSlot: 'AFTER_LUNCH', value: 142 });
    const res = await request(app).get(`/api/reports/daily?date=${date}`).set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(3);
    expect(res.body.data.highest).toBe(142);
    expect(res.body.data.lowest).toBe(100);
    expect(res.body.data.average).toBe(127.7);
  });

  test('2. Correct month-to-date report', async () => {
    const { token } = await authUser();
    await request(app).post('/api/readings').set(authHeader(token)).send({ readingDate: '2026-10-01', timeSlot: 'MORNING', value: 100 });
    await request(app).post('/api/readings').set(authHeader(token)).send({ readingDate: '2026-10-15', timeSlot: 'MORNING', value: 120 });
    await request(app).post('/api/readings').set(authHeader(token)).send({ readingDate: '2026-10-20', timeSlot: 'MORNING', value: 140 });
    const res = await request(app).get('/api/reports/month-to-date?date=2026-10-15').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(2);
    expect(res.body.data.dateRange).toEqual({ start: '2026-10-01', end: '2026-10-15' });
  });

  test('3. Correct previous-month report incl. year boundary', async () => {
    const { token } = await authUser();
    await request(app).post('/api/readings').set(authHeader(token)).send({ readingDate: '2025-12-10', timeSlot: 'MORNING', value: 110 });
    const res = await request(app).get('/api/reports/monthly?date=2026-01-15').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.data.dateRange).toEqual({ start: '2025-12-01', end: '2025-12-31' });
    expect(res.body.data.count).toBe(1);
  });

  test('5. Empty report state', async () => {
    const { token } = await authUser();
    const res = await request(app).get('/api/reports/daily?date=2026-05-01').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(0);
    expect(res.body.data.highest).toBeNull();
    expect(res.body.data.message).toMatch(/No glucose readings/);
  });

  test('6. User-specific isolation', async () => {
    const a = await authUser();
    const b = await authUser();
    await request(app).post('/api/readings').set(authHeader(a.token)).send({ readingDate: '2026-10-15', timeSlot: 'MORNING', value: 200 });
    const res = await request(app).get('/api/reports/daily?date=2026-10-15').set(authHeader(b.token));
    expect(res.body.data.count).toBe(0);
  });
});
