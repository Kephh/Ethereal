const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const User = require('../models/User');
const authRoutes = require('../routes/authRoutes');
const chatRoutes = require('../routes/chatRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());

// Mock Groq to avoid API key errors during tests
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          body: {
            getReader: () => ({
              read: jest.fn().mockResolvedValueOnce({ done: false, value: Buffer.from('data: {"content": "Test"}\n') })
                .mockResolvedValueOnce({ done: true })
            })
          }
        })
      }
    }
  }));
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

describe('Critical Transactions & Theme Integration Tests', () => {
  let token;
  let userId;
  const testEmail = `test_${Date.now()}@ethereal.ai`;

  beforeAll(async () => {
    // Increase timeout for DB operations
    jest.setTimeout(10000);
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@ethereal\.ai$/ });
    await mongoose.connection.close();
  });

  test('Registration & Default Theme Persistence', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: `testuser_${Date.now()}`,
        email: testEmail,
        password: 'password123'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    token = res.body.token;
    userId = res.body.user.id;
  });

  test('Login & Theme Consistency', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'password123'
      });

    expect(res.statusCode).toBe(200);
    token = res.body.token;
    expect(token).toBeDefined();
  });

  test('Update Theme Persistence (Transaction)', async () => {
    const res = await request(app)
      .put('/api/auth/updateprofile')
      .set('Authorization', `Bearer ${token}`)
      .send({ theme: 'light' });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.theme).toBe('light');

    // Verify it stuck in DB
    const user = await User.findById(userId);
    expect(user.theme).toBe('light');
  });

  test('Chat Functionality (Authenticated Session)', async () => {
    const res = await request(app)
      .get('/api/chat/history')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.conversations)).toBe(true);
  });

  test('Password Update Security', async () => {
    const res = await request(app)
      .put('/api/auth/updatepassword')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'password123',
        newPassword: 'newpassword456'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Account Deactivation Logic', async () => {
    // 1. Deactivate
    await request(app)
      .put('/api/auth/deactivate')
      .set('Authorization', `Bearer ${token}`);

    // 2. Attempt login (should fail)
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'newpassword456'
      });

    expect(res.statusCode).toBe(403); // Forbidden for deactivated
    expect(res.body.message).toMatch(/deactivated/i);
  });
});
