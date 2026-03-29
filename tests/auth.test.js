'use strict';

// Set env vars before any imports
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

// Mock the User model so no real DB is needed
jest.mock('../src/models/User');

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');
const authRoutes = require('../src/routes/auth');

// Build a minimal app without the mongoose.connect from server.js
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

// ── Signup ────────────────────────────────────────────────────────────────────
describe('POST /api/auth/signup', () => {
    it('returns 400 when fields are missing', async () => {
        const res = await request(app).post('/api/auth/signup').send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('All fields are required');
    });

    it('returns 409 when the user already exists', async () => {
        User.findOne.mockResolvedValue({ _id: 'existing-id' });
        const res = await request(app).post('/api/auth/signup').send({
            name: 'Test User',
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
        });
        expect(res.status).toBe(409);
    });

    it('returns 201 and user data on success', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({
            _id: 'new-user-id',
            name: 'Test User',
            username: 'testuser',
            email: 'test@example.com',
        });
        const res = await request(app).post('/api/auth/signup').send({
            name: 'Test User',
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
        });
        expect(res.status).toBe(201);
        expect(res.body.username).toBe('testuser');
        expect(res.body).not.toHaveProperty('passwordHash');
    });
});

// ── Login ─────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
    it('returns 400 when fields are missing', async () => {
        const res = await request(app).post('/api/auth/login').send({});
        expect(res.status).toBe(400);
    });

    it('returns 404 when user is not found', async () => {
        User.findOne.mockResolvedValue(null);
        const res = await request(app).post('/api/auth/login').send({
            emailOrUsername: 'nobody@example.com',
            password: 'password123',
        });
        expect(res.status).toBe(404);
    });

    it('returns 404 on wrong password', async () => {
        const hash = await bcrypt.hash('correctpassword', 4);
        User.findOne.mockResolvedValue({ _id: 'abc', username: 'testuser', passwordHash: hash });
        const res = await request(app).post('/api/auth/login').send({
            emailOrUsername: 'testuser',
            password: 'wrongpassword',
        });
        expect(res.status).toBe(404);
    });

    it('returns 200 on valid credentials', async () => {
        const hash = await bcrypt.hash('correctpassword', 4);
        User.findOne.mockResolvedValue({ _id: 'abc', username: 'testuser', passwordHash: hash });
        const res = await request(app).post('/api/auth/login').send({
            emailOrUsername: 'testuser',
            password: 'correctpassword',
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ── Logout ────────────────────────────────────────────────────────────────────
describe('POST /api/auth/logout', () => {
    it('clears cookies and returns success', async () => {
        const res = await request(app).post('/api/auth/logout');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ── Refresh ───────────────────────────────────────────────────────────────────
describe('POST /api/auth/refresh', () => {
    it('returns 401 when no refresh token cookie is present', async () => {
        const res = await request(app).post('/api/auth/refresh');
        expect(res.status).toBe(401);
    });

    it('returns 401 for an invalid refresh token', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .set('Cookie', 'refreshToken=invalid.token.here');
        expect(res.status).toBe(401);
    });
});

// ── Protected /me ──────────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
    it('returns 401 when no access token cookie is present', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });

    it('returns 401 for an invalid access token', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', 'accessToken=invalid.token.here');
        expect(res.status).toBe(401);
    });
});
