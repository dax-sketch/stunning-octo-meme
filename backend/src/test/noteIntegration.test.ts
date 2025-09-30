import request from 'supertest';
import app from '../server';
import { UserModel } from '../models/User';
import { CompanyModel } from '../models/Company';
import { JwtService } from '../utils/jwt';
import prisma from '../lib/prisma';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { afterEach } from 'node:test';
import { describe } from 'node:test';

describe('Notes Integration Tests', () => {
  let testUser1: any;
  let testUser2: any;
  let testCompany: any;
  let authToken1: string;
  let authToken2: string;

  beforeAll(async () => {
    // Create test users
    testUser1 = await UserModel.create({
      username: 'noteintegration1',
      email: 'noteintegration1@example.com',
      phoneNumber: '+1234567890',
      password: 'password123',
    });

    testUser2 = await UserModel.create({
      username: 'noteintegration2',
      email: 'noteintegration2@example.com',
      phoneNumber: '+1234567891',
      password: 'password123',
    });

    // Generate auth tokens
    authToken1 = JwtService.generateAccessToken({
      userId: testUser1.id,
      username: testUser1.username,
      email: testUser1.email,
      role: testUser1.role
    });
    authToken2 = JwtService.generateAccessToken({
      userId: testUser2.id,
      username: testUser2.username,
      email: testUser2.email,
      role: testUser2.role
    });

    // Create test company
    testCompany = await CompanyModel.create({
      name: 'Test Company for Note Integration',
      startDate: new Date(),
      phoneNumber: '+1234567890',
      email: 'company@example.com',
      website: 'https://example.com',
      createdBy: testUser1.id,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.note.deleteMany({
      where: { 
        OR: [
          { userId: testUser1.id },
          { userId: testUser2.id }
        ]
      }
    });
    await prisma.company.deleteMany({
      where: { id: testCompany.id }
    });
    await prisma.user.deleteMany({
      where: { 
        OR: [
          { id: testUser1.id },
          { id: testUser2.id }
        ]
      }
    });
  });

  afterEach(async () => {
    // Clean up notes after each test
    await prisma.note.deleteMany({
      where: { 
        OR: [
          { userId: testUser1.id },
          { userId: testUser2.id }
        ]
      }
    });
  });

  describe('Complete Note Workflow', () => {
    it('should handle complete CRUD workflow for notes', async () => {
      // 1. Create a note
      const createResponse = await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: 'Initial note content' })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const noteId = createResponse.body.data.id;

      // 2. Get the note by ID
      const getResponse = await request(app)
        .get(`/api/notes/note/${noteId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(getResponse.body.data.content).toBe('Initial note content');

      // 3. Update the note
      const updateResponse = await request(app)
        .put(`/api/notes/note/${noteId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: 'Updated note content' })
        .expect(200);

      expect(updateResponse.body.data.content).toBe('Updated note content');

      // 4. Get company notes to verify update
      const companyNotesResponse = await request(app)
        .get(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(companyNotesResponse.body.data).toHaveLength(1);
      expect(companyNotesResponse.body.data[0].content).toBe('Updated note content');

      // 5. Delete the note
      await request(app)
        .delete(`/api/notes/note/${noteId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      // 6. Verify note is deleted
      await request(app)
        .get(`/api/notes/note/${noteId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);

      // 7. Verify company has no notes
      const finalCompanyNotesResponse = await request(app)
        .get(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(finalCompanyNotesResponse.body.data).toHaveLength(0);
    });

    it('should handle multiple users adding notes to the same company', async () => {
      // User 1 creates a note
      const user1NoteResponse = await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: 'Note from user 1' })
        .expect(201);

      // User 2 creates a note
      const user2NoteResponse = await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: 'Note from user 2' })
        .expect(201);

      // Get all company notes
      const companyNotesResponse = await request(app)
        .get(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(companyNotesResponse.body.data).toHaveLength(2);
      
      // Verify both users' notes are present
      const noteContents = companyNotesResponse.body.data.map((note: any) => note.content);
      expect(noteContents).toContain('Note from user 1');
      expect(noteContents).toContain('Note from user 2');

      // Verify user information is included
      const usernames = companyNotesResponse.body.data.map((note: any) => note.user.username);
      expect(usernames).toContain(testUser1.username);
      expect(usernames).toContain(testUser2.username);
    });

    it('should enforce note ownership for updates and deletes', async () => {
      // User 1 creates a note
      const createResponse = await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: 'User 1 note' })
        .expect(201);

      const noteId = createResponse.body.data.id;

      // User 2 tries to update User 1's note (should fail)
      await request(app)
        .put(`/api/notes/note/${noteId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: 'User 2 trying to update' })
        .expect(403);

      // User 2 tries to delete User 1's note (should fail)
      await request(app)
        .delete(`/api/notes/note/${noteId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(403);

      // User 1 can still update their own note
      await request(app)
        .put(`/api/notes/note/${noteId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: 'User 1 updated content' })
        .expect(200);

      // User 1 can delete their own note
      await request(app)
        .delete(`/api/notes/note/${noteId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);
    });

    it('should handle user notes endpoint correctly', async () => {
      // User 1 creates notes for different companies
      await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: 'User 1 note 1' })
        .expect(201);

      await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: 'User 1 note 2' })
        .expect(201);

      // User 2 creates a note
      await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: 'User 2 note' })
        .expect(201);

      // Get User 1's notes
      const user1NotesResponse = await request(app)
        .get('/api/notes/user')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(user1NotesResponse.body.data).toHaveLength(2);
      expect(user1NotesResponse.body.data.every((note: any) => note.userId === testUser1.id)).toBe(true);

      // Get User 2's notes
      const user2NotesResponse = await request(app)
        .get('/api/notes/user')
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(user2NotesResponse.body.data).toHaveLength(1);
      expect(user2NotesResponse.body.data[0].userId).toBe(testUser2.id);
    });

    it('should handle note ordering correctly (newest first)', async () => {
      // Create notes with delays to ensure different timestamps
      const note1Response = await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: 'First note' })
        .expect(201);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      const note2Response = await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: 'Second note' })
        .expect(201);

      // Wait a bit more
      await new Promise(resolve => setTimeout(resolve, 10));

      const note3Response = await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: 'Third note' })
        .expect(201);

      // Get company notes
      const companyNotesResponse = await request(app)
        .get(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      const notes = companyNotesResponse.body.data;
      expect(notes).toHaveLength(3);
      
      // Verify ordering (newest first)
      expect(notes[0].content).toBe('Third note');
      expect(notes[1].content).toBe('Second note');
      expect(notes[2].content).toBe('First note');

      // Verify timestamps are in descending order
      const timestamps = notes.map((note: any) => new Date(note.createdAt).getTime());
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }
    });

    it('should handle validation errors properly', async () => {
      // Test empty content
      await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: '' })
        .expect(400);

      // Test whitespace-only content
      await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: '   ' })
        .expect(400);

      // Test missing content
      await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({})
        .expect(400);

      // Test content too long
      const longContent = 'a'.repeat(5001);
      await request(app)
        .post(`/api/notes/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: longContent })
        .expect(400);
    });
  });
});