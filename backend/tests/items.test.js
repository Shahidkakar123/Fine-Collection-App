const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');
const User = require('../models/User');
const Item = require('../models/Item');
const bcrypt = require('bcrypt');

describe('Fine Collection API', () => {
  let token;
  let userId;
  let itemId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fine_collection_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const hashedPassword = await bcrypt.hash('testpass', 10);
    await User.create({ username: 'testuser', password: hashedPassword });

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({ username: 'testuser', password: 'testpass' });
    expect(loginResponse.status).toBe(200);
    token = loginResponse.body.token;
    userId = (await User.findOne({ username: 'testuser' }))._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Item.deleteMany({});
    await mongoose.connection.close();
  });

  test('POST /api/items should create an item', async () => {
    const response = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Coin',
        description: 'A test coin',
        category: 'Coin',
        value: 100
      });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('_id');
    expect(response.body.name).toBe('Test Coin');
    itemId = response.body._id;
  });

  test('GET /api/items should return items for authenticated user', async () => {
    const response = await request(app)
      .get('/api/items')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe('Test Coin');
  });

  test('PUT /api/items/:id should update an item', async () => {
    const response = await request(app)
      .put(`/api/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Test Coin',
        description: 'Updated description',
        category: 'Coin',
        value: 150
      });
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Test Coin');
    expect(response.body.value).toBe(150);
  });

  test('DELETE /api/items/:id should delete an item', async () => {
    const response = await request(app)
      .delete(`/api/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Item deleted');
  });
});