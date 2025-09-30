import { Note } from '../models/Note';

describe('Note Validation', () => {
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

    it('should handle undefined content', () => {
      const result = Note.validateContent(undefined as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Note content is required');
    });

    it('should accept content at maximum length', () => {
      const maxContent = 'a'.repeat(5000);
      const result = Note.validateContent(maxContent);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept content with newlines and special characters', () => {
      const content = 'This is a note with\nnewlines and special chars: !@#$%^&*()';
      const result = Note.validateContent(content);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});