import {
  UserModel,
  CreateUserData as UserModelCreateData,
} from '../models/AppwriteUser';
import bcrypt from 'bcryptjs';

export interface CreateUserData {
  email: string;
  password: string;
  username: string;
  role: 'CEO' | 'MANAGER' | 'TEAM_MEMBER';
  firstName?: string;
  lastName?: string;
}

export interface CreatedUserResponse {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
}

export class UserCreationService {
  /**
   * Create a new user account (admin only)
   */
  async createUser(
    data: CreateUserData,
    createdBy: string
  ): Promise<CreatedUserResponse> {
    try {
      // Validate that the creator has permission
      const creator = await UserModel.findById(createdBy);
      if (!creator || (creator.role !== 'CEO' && creator.role !== 'MANAGER')) {
        throw new Error('Insufficient permissions to create users');
      }

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(data.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const existingUsername = await UserModel.findByUsername(data.username);
      if (existingUsername) {
        throw new Error('Username already taken');
      }

      // Only CEOs can create other CEOs
      if (data.role === 'CEO' && creator.role !== 'CEO') {
        throw new Error('Only CEOs can create other CEO accounts');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      // Create user data
      const userData: UserModelCreateData = {
        username: data.username,
        email: data.email,
        phoneNumber: '', // Default empty value
        password: hashedPassword,
        role: data.role,
      };

      // Create the user
      const user = await UserModel.create(userData);

      return {
        id: user.$id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.$createdAt,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(requesterId: string): Promise<any[]> {
    try {
      // Validate that the requester has permission
      const requester = await UserModel.findById(requesterId);
      if (
        !requester ||
        (requester.role !== 'CEO' && requester.role !== 'MANAGER')
      ) {
        throw new Error('Insufficient permissions to view users');
      }

      const result = await UserModel.findMany({ limit: 100 }); // Get up to 100 users

      // Return user data without sensitive information
      return result.users.map((user: any) => ({
        id: user.$id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.$createdAt,
        updatedAt: user.$updatedAt,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Delete a user (admin only)
   */
  async deleteUser(userId: string, deletedBy: string): Promise<boolean> {
    try {
      // Validate that the deleter has permission
      const deleter = await UserModel.findById(deletedBy);
      if (!deleter || (deleter.role !== 'CEO' && deleter.role !== 'MANAGER')) {
        throw new Error('Insufficient permissions to delete users');
      }

      const userToDelete = await UserModel.findById(userId);
      if (!userToDelete) {
        throw new Error('User not found');
      }

      // Only CEOs can delete other CEOs
      if (userToDelete.role === 'CEO' && deleter.role !== 'CEO') {
        throw new Error('Only CEOs can delete other CEO accounts');
      }

      // Prevent self-deletion
      if (userId === deletedBy) {
        throw new Error('Cannot delete your own account');
      }

      await UserModel.delete(userId);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}
