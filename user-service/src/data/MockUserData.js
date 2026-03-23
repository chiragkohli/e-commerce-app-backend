'use strict';

/**
 * Mock user store - mirrors UserService.API.Data.MockUserData
 * Passwords are stored in plain-text for demo purposes ONLY.
 */
const MOCK_USERS = Object.freeze([
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    username: 'John Doe',
    password: 'password123',
    email: 'john@example.com',
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    username: 'Jane Smith',
    password: 'securepass456',
    email: 'jane@example.com',
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
]);

function getMockUsers() {
  return MOCK_USERS;
}

module.exports = { getMockUsers };
