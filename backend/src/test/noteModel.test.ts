import { Note } from '../models/Note';
import { UserModel } from '../models/User';
import { CompanyModel } from '../models/Company';
import prisma from '../lib/prisma';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
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
import { it } from 'node:test';
import { describe } from 'node:test';
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
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { afterEach } from 'node:test';
import { describe } from 'node:test';

describe('Note Model', () => {
    let testUser: any;
    let testCompany: any;

    beforeAll(async () => {
        // Create test user
        testUser = await UserModel.create({
            username: 'notetest',
            email: 'notetest@example.com',
            phoneNumber: '+1234567890',
            password: 'Password123',
        });

        // Create test company
        testCompany = await CompanyModel.create({
            name: 'Test Company for Notes',
            startDate: new Date(),
            phoneNumber: '+1234567890',
            email: 'company@example.com',
            website: 'https://example.com',
            createdBy: testUser.id,
        });
    });

    afterAll(async () => {
        // Clean up test data
        if (testUser?.id) {
            await prisma.note.deleteMany({
                where: { userId: testUser.id }
            });
        }
        if (testCompany?.id) {
            await prisma.company.deleteMany({
                where: { id: testCompany.id }
            });
        }
        if (testUser?.id) {
            await prisma.user.deleteMany({
                where: { id: testUser.id }
            });
        }
    });

    afterEach(async () => {
        // Clean up notes after each test
        if (testUser?.id) {
            await prisma.note.deleteMany({
                where: { userId: testUser.id }
            });
        }
    });

    describe('create', () => {
        it('should create a note successfully', async () => {
            const noteData = {
                content: 'This is a test note',
                companyId: testCompany.id,
                userId: testUser.id,
            };

            const note = await Note.create(noteData);

            expect(note).toBeDefined();
            expect(note.content).toBe(noteData.content);
            expect(note.companyId).toBe(noteData.companyId);
            expect(note.userId).toBe(noteData.userId);
            expect(note.createdAt).toBeDefined();
            expect(note.updatedAt).toBeDefined();
        });

        it('should trim whitespace from content', async () => {
            const noteData = {
                content: '  This is a test note with whitespace  ',
                companyId: testCompany.id,
                userId: testUser.id,
            };

            const note = await Note.create(noteData);

            expect(note.content).toBe('This is a test note with whitespace');
        });

        it('should throw error for empty content', async () => {
            const noteData = {
                content: '',
                companyId: testCompany.id,
                userId: testUser.id,
            };

            await expect(Note.create(noteData)).rejects.toThrow('Note content is required');
        });

        it('should throw error for whitespace-only content', async () => {
            const noteData = {
                content: '   ',
                companyId: testCompany.id,
                userId: testUser.id,
            };

            await expect(Note.create(noteData)).rejects.toThrow('Note content is required');
        });

        it('should throw error for missing companyId', async () => {
            const noteData = {
                content: 'Test note',
                companyId: '',
                userId: testUser.id,
            };

            await expect(Note.create(noteData)).rejects.toThrow('Company ID is required');
        });

        it('should throw error for missing userId', async () => {
            const noteData = {
                content: 'Test note',
                companyId: testCompany.id,
                userId: '',
            };

            await expect(Note.create(noteData)).rejects.toThrow('User ID is required');
        });

        it('should throw error for non-existent company', async () => {
            const noteData = {
                content: 'Test note',
                companyId: 'non-existent-id',
                userId: testUser.id,
            };

            await expect(Note.create(noteData)).rejects.toThrow('Company not found');
        });

        it('should throw error for non-existent user', async () => {
            const noteData = {
                content: 'Test note',
                companyId: testCompany.id,
                userId: 'non-existent-id',
            };

            await expect(Note.create(noteData)).rejects.toThrow('User not found');
        });
    });

    describe('findByCompanyId', () => {
        it('should return notes for a company ordered by creation date (newest first)', async () => {
            // Create multiple notes
            const note1 = await Note.create({
                content: 'First note',
                companyId: testCompany.id,
                userId: testUser.id,
            });

            // Wait a bit to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10));

            const note2 = await Note.create({
                content: 'Second note',
                companyId: testCompany.id,
                userId: testUser.id,
            });

            const notes = await Note.findByCompanyId(testCompany.id);

            expect(notes).toHaveLength(2);
            expect(notes[0]?.content).toBe('Second note'); // Newest first
            expect(notes[1]?.content).toBe('First note');
            expect(notes[0]?.user).toBeDefined();
            expect(notes[0]?.user.username).toBe(testUser.username);
        });

        it('should return empty array for company with no notes', async () => {
            const notes = await Note.findByCompanyId(testCompany.id);
            expect(notes).toHaveLength(0);
        });

        it('should throw error for missing companyId', async () => {
            await expect(Note.findByCompanyId('')).rejects.toThrow('Company ID is required');
        });
    });

    describe('findById', () => {
        it('should return note with user information', async () => {
            const createdNote = await Note.create({
                content: 'Test note',
                companyId: testCompany.id,
                userId: testUser.id,
            });

            const note = await Note.findById(createdNote.id);

            expect(note).toBeDefined();
            expect(note!.content).toBe('Test note');
            expect(note!.user).toBeDefined();
            expect(note!.user.username).toBe(testUser.username);
        });

        it('should return null for non-existent note', async () => {
            const note = await Note.findById('non-existent-id');
            expect(note).toBeNull();
        });

        it('should throw error for missing noteId', async () => {
            await expect(Note.findById('')).rejects.toThrow('Note ID is required');
        });
    });

    describe('update', () => {
        it('should update note content successfully', async () => {
            const createdNote = await Note.create({
                content: 'Original content',
                companyId: testCompany.id,
                userId: testUser.id,
            });

            const updatedNote = await Note.update(createdNote.id, { content: 'Updated content' }, testUser.id);

            expect(updatedNote.content).toBe('Updated content');
            expect(updatedNote.id).toBe(createdNote.id);
        });

        it('should trim whitespace from updated content', async () => {
            const createdNote = await Note.create({
                content: 'Original content',
                companyId: testCompany.id,
                userId: testUser.id,
            });

            const updatedNote = await Note.update(createdNote.id, { content: '  Updated content  ' }, testUser.id);

            expect(updatedNote.content).toBe('Updated content');
        });

        it('should throw error for empty content', async () => {
            const createdNote = await Note.create({
                content: 'Original content',
                companyId: testCompany.id,
                userId: testUser.id,
            });

            await expect(Note.update(createdNote.id, { content: '' }, testUser.id))
                .rejects.toThrow('Note content is required');
        });

        it('should throw error for non-existent note', async () => {
            await expect(Note.update('non-existent-id', { content: 'Updated content' }, testUser.id))
                .rejects.toThrow('Note not found');
        });

        it('should throw error when user tries to update another user\'s note', async () => {
            // Create another user
            const anotherUser = await UserModel.create({
                username: 'anotheruser',
                email: 'another@example.com',
                phoneNumber: '+1234567891',
                password: 'Password123',
            });

            const createdNote = await Note.create({
                content: 'Original content',
                companyId: testCompany.id,
                userId: testUser.id,
            });

            await expect(Note.update(createdNote.id, { content: 'Updated content' }, anotherUser.id))
                .rejects.toThrow('Unauthorized: You can only edit your own notes');

            // Clean up
            await prisma.user.delete({ where: { id: anotherUser.id } });
        });
    });

    describe('delete', () => {
        it('should delete note successfully', async () => {
            const createdNote = await Note.create({
                content: 'Note to delete',
                companyId: testCompany.id,
                userId: testUser.id,
            });

            await Note.delete(createdNote.id, testUser.id);

            const deletedNote = await Note.findById(createdNote.id);
            expect(deletedNote).toBeNull();
        });

        it('should throw error for non-existent note', async () => {
            await expect(Note.delete('non-existent-id', testUser.id))
                .rejects.toThrow('Note not found');
        });

        it('should throw error when user tries to delete another user\'s note', async () => {
            // Create another user
            const anotherUser = await UserModel.create({
                username: 'anotheruser2',
                email: 'another2@example.com',
                phoneNumber: '+1234567892',
                password: 'Password123',
            });

            const createdNote = await Note.create({
                content: 'Note to delete',
                companyId: testCompany.id,
                userId: testUser.id,
            });

            await expect(Note.delete(createdNote.id, anotherUser.id))
                .rejects.toThrow('Unauthorized: You can only delete your own notes');

            // Clean up
            await prisma.user.delete({ where: { id: anotherUser.id } });
        });
    });

    describe('findByUserId', () => {
        it('should return all notes by user ordered by creation date', async () => {
            // Create notes for the user
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

            const notes = await Note.findByUserId(testUser.id);

            expect(notes).toHaveLength(2);
            expect(notes.every(note => note.userId === testUser.id)).toBe(true);
        });

        it('should throw error for missing userId', async () => {
            await expect(Note.findByUserId('')).rejects.toThrow('User ID is required');
        });
    });

    describe('validateContent', () => {
        it('should validate valid content', () => {
            const result = Note.validateContent('Valid note content');
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject empty content', () => {
            const result = Note.validateContent('');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Note content is required');
        });

        it('should reject whitespace-only content', () => {
            const result = Note.validateContent('   ');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Note content cannot be empty');
        });

        it('should reject content that is too long', () => {
            const longContent = 'a'.repeat(5001);
            const result = Note.validateContent(longContent);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Note content cannot exceed 5000 characters');
        });

        it('should handle null content', () => {
            const result = Note.validateContent(null as any);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Note content is required');
        });
    });
});