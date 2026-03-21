'use strict';

const { MongoClient } = require('mongodb');

let _client = null;
let _db = null;

async function connect() {
  if (_client) return _db;
  _client = new MongoClient(process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017', {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });
  await _client.connect();
  _db = _client.db(process.env.MONGODB_DATABASE_NAME || 'ecomasnmnt');
  console.log('[OrderService] Connected to MongoDB');
  return _db;
}

function getDb() {
  if (!_db) throw new Error('MongoDB not connected');
  return _db;
}

module.exports = { connect, getDb };
