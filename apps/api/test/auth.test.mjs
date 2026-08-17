import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { DEMO_PASSWORD } from '@bid/core';
import { buildServer } from '../dist/app.js';
import { loadConfig } from '../dist/config.js';
import { ApiContext } from '../dist/context.js';

/**
 * Authentication.
 *
 * The point of these is the refusals: what a wrong password reveals, what a
 * revoked token can still do, and whether registering buys you anything you
 * have not paid for.
 */

let app;
let context;

before(async () => {
  context = await ApiContext.create(
    loadConfig({ ...process.env, BID_PERSISTENCE: 'memory', REQUEST_LOGGING: 'false' }),
  );
  app = await buildServer(context);
  await app.ready();
});

after(async () => {
  await app.close();
});

const json = (response) => JSON.parse(response.body);
const bearer = (token) => ({ authorization: `Bearer ${token}`, 'content-type': 'application/json' });
const JSON_HEADERS = { 'content-type': 'application/json' };

const register = (payload) =>
  app.inject({ method: 'POST', url: '/v1/auth/register', headers: JSON_HEADERS, payload });
const login = (payload) =>
  app.inject({ method: 'POST', url: '/v1/auth/login', headers: JSON_HEADERS, payload });

test('registering creates an organization, a workspace and an owner', async () => {
  const response = await register({
    legalName: 'Registration Test Works Private Limited',
    industry: 'MANUFACTURING',
    name: 'Test Owner',
    email: 'owner@registration-test.example',
    password: 'a sufficiently long passphrase',
  });

  assert.equal(response.statusCode, 201);
  const data = json(response).data;
  assert.ok(data.token.startsWith('bid_sess_'), 'a session token is issued');
  assert.match(data.organization.bidId, /^BID-BUS-\d{5}$/);

  const me = await app.inject({ method: 'GET', url: '/v1/auth/me', headers: bearer(data.token) });
  assert.equal(json(me).data.workspace.roles[0], 'OWNER');
  assert.equal(
    json(me).data.organization.commercialState,
    'MEMBER',
    'signing up makes a member; only paying makes a customer',
  );
  assert.equal(
    json(me).data.entitlements.canInitiateVerification,
    false,
    'a new member cannot initiate verification without a requester plan',
  );
});

test('the same email cannot register twice', async () => {
  const payload = {
    legalName: 'Duplicate Test Private Limited',
    name: 'First Person',
    email: 'duplicate@registration-test.example',
    password: 'a sufficiently long passphrase',
  };
  assert.equal((await register(payload)).statusCode, 201);

  const second = await register({ ...payload, legalName: 'Different Legal Name Private Limited' });
  assert.equal(second.statusCode, 409);
  assert.equal(json(second).error.code, 'CONFLICT');
});

test('a short password is refused with a message about the password', async () => {
  const response = await register({
    legalName: 'Weak Password Private Limited',
    name: 'Test Person',
    email: 'weak@registration-test.example',
    password: 'short',
  });
  assert.equal(response.statusCode, 422);
  assert.equal(json(response).error.field, 'password');
});

test('a failed login does not reveal whether the account exists', async () => {
  const unknown = await login({ email: 'nobody@registration-test.example', password: 'a sufficiently long passphrase' });
  const wrong = await login({ email: 'owner@registration-test.example', password: 'the wrong passphrase entirely' });

  assert.equal(unknown.statusCode, 401);
  assert.equal(wrong.statusCode, 401);
  assert.deepEqual(json(unknown).error, json(wrong).error, 'both refusals are indistinguishable');
});

test('a seeded demo account can sign in and is scoped to its own workspace', async () => {
  const response = await login({ email: 'priya.nair@abc-technologies.example', password: DEMO_PASSWORD });
  assert.equal(response.statusCode, 200);
  const token = json(response).data.token;

  const me = await app.inject({ method: 'GET', url: '/v1/auth/me', headers: bearer(token) });
  assert.equal(json(me).data.organization.bidId, 'BID-BUS-00104');
  assert.equal(json(me).data.authenticatedVia, 'SESSION');

  const relationships = await app.inject({ method: 'GET', url: '/v1/relationships', headers: bearer(token) });
  assert.equal(relationships.statusCode, 200);
  assert.ok(json(relationships).count > 0, 'the session sees its own workspace');
});

test('a revoked session stops working immediately', async () => {
  const token = json(await login({ email: 'priya.nair@abc-technologies.example', password: DEMO_PASSWORD })).data.token;

  const before = await app.inject({ method: 'GET', url: '/v1/auth/me', headers: bearer(token) });
  assert.equal(before.statusCode, 200);

  const loggedOut = await app.inject({ method: 'POST', url: '/v1/auth/logout', headers: bearer(token) });
  assert.equal(loggedOut.statusCode, 200);

  const after_ = await app.inject({ method: 'GET', url: '/v1/auth/me', headers: bearer(token) });
  assert.equal(after_.statusCode, 401, 'the token is dead, not merely expired');
});

test('the raw token is never stored and never returned', async () => {
  const token = json(await login({ email: 'priya.nair@abc-technologies.example', password: DEMO_PASSWORD })).data.token;

  const stored = context.platform.store.sessions.all();
  assert.ok(stored.every((session) => session.tokenHash !== token), 'sessions hold a digest, not the token');

  const list = await app.inject({ method: 'GET', url: '/v1/auth/sessions', headers: bearer(token) });
  assert.ok(!list.body.includes(token), 'the session list does not hand the credential back');
  assert.ok(!list.body.includes('tokenHash'), 'nor its digest');
});

test('passwords are never returned by any route that exposes a user', async () => {
  const token = json(await login({ email: 'priya.nair@abc-technologies.example', password: DEMO_PASSWORD })).data.token;
  const me = await app.inject({ method: 'GET', url: '/v1/auth/me', headers: bearer(token) });
  assert.ok(!me.body.includes('passwordHash'));
  assert.ok(!me.body.includes('pbkdf2'));
});

test('an unknown or malformed bearer token is unauthorized, not an error', async () => {
  for (const token of ['bid_sess_not-a-real-token', 'garbage', '']) {
    const response = await app.inject({ method: 'GET', url: '/v1/auth/me', headers: bearer(token) });
    assert.equal(response.statusCode, 401, `rejected: ${token || '(empty)'}`);
  }
});

test('repeated failures lock the account, and the lockout is not disclosed', async () => {
  const email = 'lockout@registration-test.example';
  await register({
    legalName: 'Lockout Test Private Limited',
    name: 'Lock Test',
    email,
    password: 'a sufficiently long passphrase',
  });

  let last;
  for (let attempt = 0; attempt < 9; attempt += 1) {
    last = await login({ email, password: 'definitely the wrong one' });
  }
  assert.equal(last.statusCode, 401);
  assert.equal(json(last).error.code, 'INVALID_CREDENTIALS', 'a locked account looks like a wrong password');

  const correct = await login({ email, password: 'a sufficiently long passphrase' });
  assert.equal(correct.statusCode, 401, 'the correct password is refused while locked');
  assert.equal(context.platform.identity.byEmail(email).failedLoginCount >= 8, true);
});
