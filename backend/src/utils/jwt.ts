import jwt from 'jsonwebtoken';
import { type UserRole } from '../config/appwrite';

export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JwtService {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'your-access-secret-key';
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  private static readonly ACCESS_TOKEN_EXPIRES_IN = '30d';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '30d';

  // Generate access token
  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
      issuer: 'client-management-platform',
      audience: 'client-management-users'
    });
  }

  // Generate refresh token
  static generateRefreshToken(payload: Pick<JwtPayload, 'userId'>): string {
    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'client-management-platform',
      audience: 'client-management-users'
    });
  }

  // Generate token pair
  static generateTokenPair(payload: JwtPayload): TokenPair {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken({ userId: payload.userId });
    
    return {
      accessToken,
      refreshToken
    };
  }

  // Verify access token
  static verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
        issuer: 'client-management-platform',
        audience: 'client-management-users'
      }) as JwtPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): Pick<JwtPayload, 'userId'> {
    try {
      const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET, {
        issuer: 'client-management-platform',
        audience: 'client-management-users'
      }) as Pick<JwtPayload, 'userId'>;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  // Extract token from Authorization header
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1] || null;
  }
}