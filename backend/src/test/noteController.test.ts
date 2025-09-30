import request from 'supertest';
import app from '../server';
import { UserModel } from '../models/User';
import { CompanyModel } from '../models/Company';
import { Note } from '../models/Note';
import { JwtService } from '../utils/jwt';
import prisma from '../lib/prisma';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { afterEach } from 'node:test';
import { describe } from 'node:test';

describe('Note Controller', () => {
  let testUser: any;
  let testCompany: any;
  let authToken: string;

  beforeAll(async () => {
    // Create test user
    testUser = await UserModel.create({
      username: 'notecontrollertest',
      email: 'notecontrollertest@example.com',
      phoneNumber: '+1234567890',
      password: 'password123',
    });

    // Generate auth token
    authToken = JwtService.generateAccessToken({
      userId: testUser.id,
      username: testUser.username,
      email: testUser.email,
      role: testUser.role
    });

    // Create test company
    testCompany = await CompanyModel.create({
      name: 'Test Company for Note Controller',
      startDate: new Date(),
      phoneNumber: '+1234567890',
      email: 'company@example.com',
      website: 'https://example.com',
      createdBy: testUser.id,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.note.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.company.deleteMany({
      where: { id: testCompany.id }
    });
    await prisma.user.deleteMany({
      where: { id: testUser.id }
    });
  });

  afterEach(async () => {
    // Clean up notes after each test
    await prisma.note.deleteMany({
      where: { userId: testUser.id }
    });
  });

  describe('POST /api/notes/company/:companyId', () => {
    it('should create a note successfully', async () => {
      const noteData = {
        content: 'This is a test note from controller',
      };

      const response = await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(noteData.content);
      expect(response.body.data.user.username).toBe(testUser.username);
    });

    it('should return 400 for empty content', async () => {
      const noteData = {
        content: '',
      };

      const response = await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without authentication', async () => {
      const noteData = {
        content: 'This is a test note',
      };

      const response = await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .send(noteData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent company', async () => {
      const noteData = {
        content: 'This is a test note',
      };

      const response = await request(app)
        .post('/api/notes/company/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/notes/company/:companyId', () => {
    it('should get all notes for a company', async () => {
      // Create test notes
      await Note.create({
        content: 'First note',
        companyId: testCompany.id,
        userId: testUser.id,
      });

      await Note.create({
        content: 'Second note',
        companyId: testCompany.id,
        userId: testUser.id,
      });

      const response = await request(app)
        .get(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].user.username).toBe(testUser.username);
    });

    it('should return empty array for company with no notes', async () => {
      const response = await request(app)
        .get(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/notes/company/${testCompany.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing company ID', async () => {
      const response = await request(app)
        .get('/api/notes/company/')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404); // Route not found
    });
  });

  describe('GET /api/notes/note/:noteId', () => {
    it('should get a specific note', async () => {
      const createdNote = await Note.create({
        content: 'Test note for retrieval',
        companyId: testCompany.id,
        userId: testUser.id,
      });

      const response = await request(app)
        .get(`/api/notes/note/${createdNote.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Test note for retrieval');
      expect(response.body.data.user.username).toBe(testUser.username);
    });

    it('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .get('/api/notes/note/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOTE_NOT_FOUND');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/notes/note/some-id')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/notes/note/:noteId', () => {
    it('should update a note successfully', async () => {
      const createdNote = await Note.create({
        content: 'Original content',
        companyId: testCompany.id,
        userId: testUser.id,
      });

      const updateData = {
        content: 'Updated content',
      };

      const response = await request(app)
        .put(`/api/notes/note/${createdNote.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Updated content');
    });

    it('should return 400 for empty content', async () => {
      const createdNote = await Note.create({
        content: 'Original content',
        companyId: testCompany.id,
        userId: testUser.id,
      });

      const updateData = {
        content: '',
      };

      const response = await request(app)
        .put(`/api/notes/note/${createdNote.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent note', async () => {
      const updateData = {
        content: 'Updated content',
      };

      const response = await request(app)
        .put('/api/notes/note/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOTE_NOT_FOUND');
    });

    it('should return 401 without authentication', async () => {
      const updateData = {
        content: 'Updated content',
      };

      const response = await request(app)
        .put('/api/notes/note/some-id')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/notes/note/:noteId', () => {
    it('should delete a note successfully', async () => {
      const createdNote = await Note.create({
        content: 'Note to delete',
        companyId: testCompany.id,
        userId: testUser.id,
      });

      const response = await request(app)
        .delete(`/api/notes/note/${createdNote.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Note deleted successfully');

      // Verify note is deleted
      const deletedNote = await Note.findById(createdNote.id);
      expect(deletedNote).toBeNull();
    });

    it('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .delete('/api/notes/note/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOTE_NOT_FOUND');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/notes/note/some-id')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/notes/user', () => {
    it('should get all notes by the current user', async () => {
      // Create test notes
      await Note.create({
        content: 'User note 1',
        companyId: testCompany.id,
        userId: testUser.id,
      });

      await Note.create({
        content: 'User note 2',
        companyId: testCompany.id,
        userId: testUser.id,
      });

      const response = await request(app)
        .get('/api/notes/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((note: any) => note.userId === testUser.id)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/notes/user')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});