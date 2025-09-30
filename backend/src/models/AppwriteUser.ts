import { databases, COLLECTIONS, generateId, USER_ROLES, type UserRole } from '../config/appwrite';
import { Query } from 'appwrite';

export interface AppwriteUser {
  $id: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
  // Commenting out notifications for now
  // emailNotifications: boolean;
  // smsNotifications: boolean;
  // meetingReminders: boolean;
  // auditReminders: boolean;
  $createdAt: string;
  $updatedAt: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  role?: UserRole;
  // Commenting out notifications for now
  // emailNotifications?: boolean;
  // smsNotifications?: boolean;
  // meetingReminders?: boolean;
  // auditReminders?: boolean;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  role?: UserRole;
  // Commenting out notifications for now
  // emailNotifications?: boolean;
  // smsNotifications?: boolean;
  // meetingReminders?: boolean;
  // auditReminders?: boolean;
}

export class UserModel {
  private static databaseId = process.env.APPWRITE_DATABASE_ID || 'client-management';
  private static collectionId = COLLECTIONS.USERS;

  /**
   * Create a new user
   */
  static async create(data: CreateUserData): Promise<AppwriteUser> {
    const userData = {
      username: data.username,
      email: data.email,
      phoneNumber: data.phoneNumber,
      password: data.password,
      role: data.role || USER_ROLES.TEAM_MEMBER,
      // Commenting out notifications for now
      // emailNotifications: data.emailNotifications ?? true,
      // smsNotifications: data.smsNotifications ?? true,
      // meetingReminders: data.meetingReminders ?? true,
      // auditReminders: data.auditReminders ?? true,

    };

    return await databases.createDocument(
      this.databaseId,
      this.collectionId,
      generateId(),
      userData
    ) as unknown as AppwriteUser;
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<AppwriteUser | null> {
    try {
      return await databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      ) as unknown as AppwriteUser;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<AppwriteUser | null> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [Query.equal('email', email)]
      );
      
      return response.documents.length > 0 ? response.documents[0] as unknown as AppwriteUser : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by username
   */
  static async findByUsername(username: string): Promise<AppwriteUser | null> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [Query.equal('username', username)]
      );
      
      return response.documents.length > 0 ? response.documents[0] as unknown as AppwriteUser : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user by ID
   */
  static async update(id: string, data: UpdateUserData): Promise<AppwriteUser> {
    // Don't add updatedAt since it's not in the Appwrite collection schema
    return await databases.updateDocument(
      this.databaseId,
      this.collectionId,
      id,
      data
    ) as unknown as AppwriteUser;
  }

  /**
   * Delete user by ID
   */
  static async delete(id: string): Promise<void> {
    await databases.deleteDocument(
      this.databaseId,
      this.collectionId,
      id
    );
  }

  /**
   * Find all users with pagination
   */
  static async findMany(options: {
    limit?: number;
    offset?: number;
    role?: UserRole;
  } = {}): Promise<{ users: AppwriteUser[]; total: number }> {
    const queries = [];
    
    if (options.role) {
      queries.push(Query.equal('role', options.role));
    }
    
    if (options.limit) {
      queries.push(Query.limit(options.limit));
    }
    
    if (options.offset) {
      queries.push(Query.offset(options.offset));
    }

    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );

    return {
      users: response.documents as unknown as AppwriteUser[],
      total: response.total,
    };
  }

  /**
   * Check if user exists by email
   */
  static async existsByEmail(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  /**
   * Check if user exists by username
   */
  static async existsByUsername(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    return user !== null;
  }

  /**
   * Get users by role
   */
  static async findByRole(role: UserRole): Promise<AppwriteUser[]> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [Query.equal('role', role)]
    );

    return response.documents as unknown as AppwriteUser[];
  }
}