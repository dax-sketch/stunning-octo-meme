import { databases, COLLECTIONS, generateId } from '../config/appwrite';
import { Query } from 'appwrite';
import { UserModel } from './AppwriteUser';

export interface AppwriteNote {
  $id: string;
  content: string;
  companyId: string;
  userId: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface NoteWithUser
  extends Omit<AppwriteNote, '$id' | '$createdAt' | '$updatedAt'> {
  id: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
  };
}

export interface CreateNoteData {
  content: string;
  companyId: string;
  userId: string;
}

export interface UpdateNoteData {
  content?: string;
}

export class Note {
  private static databaseId =
    process.env.APPWRITE_DATABASE_ID || 'client-management';
  private static collectionId = COLLECTIONS.NOTES;

  /**
   * Create a new note
   */
  static async create(data: CreateNoteData): Promise<NoteWithUser> {
    const noteData = {
      content: data.content,
      companyId: data.companyId,
      userId: data.userId,
    };

    const note = (await databases.createDocument(
      this.databaseId,
      this.collectionId,
      generateId(),
      noteData
    )) as unknown as AppwriteNote;

    return await this.populateUserData(note);
  }

  /**
   * Populate user data for a note
   */
  private static async populateUserData(
    note: AppwriteNote
  ): Promise<NoteWithUser> {
    const user = await UserModel.findById(note.userId);

    const result: NoteWithUser = {
      id: note.$id,
      content: note.content,
      companyId: note.companyId,
      userId: note.userId,
      createdAt: note.$createdAt,
      updatedAt: note.$updatedAt,
    };

    if (user) {
      result.user = {
        id: user.$id,
        username: user.username,
      };
    }

    return result;
  }

  /**
   * Find note by ID
   */
  static async findById(id: string): Promise<NoteWithUser | null> {
    try {
      const note = (await databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      )) as unknown as AppwriteNote;

      return await this.populateUserData(note);
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Find notes by company ID
   */
  static async findByCompanyId(companyId: string): Promise<NoteWithUser[]> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [Query.equal('companyId', companyId), Query.orderDesc('$createdAt')]
    );

    const notes = response.documents as unknown as AppwriteNote[];
    return await Promise.all(notes.map((note) => this.populateUserData(note)));
  }

  /**
   * Find notes by user ID
   */
  static async findByUserId(userId: string): Promise<NoteWithUser[]> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [Query.equal('userId', userId), Query.orderDesc('$createdAt')]
    );

    const notes = response.documents as unknown as AppwriteNote[];
    return await Promise.all(notes.map((note) => this.populateUserData(note)));
  }

  /**
   * Update note by ID
   */
  static async update(id: string, data: UpdateNoteData): Promise<NoteWithUser> {
    const updateData = {
      ...data,
    };

    const note = (await databases.updateDocument(
      this.databaseId,
      this.collectionId,
      id,
      updateData
    )) as unknown as AppwriteNote;

    return await this.populateUserData(note);
  }

  /**
   * Delete note by ID
   */
  static async delete(id: string): Promise<void> {
    await databases.deleteDocument(this.databaseId, this.collectionId, id);
  }
}
