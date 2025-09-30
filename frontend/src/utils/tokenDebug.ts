// Utility to help debug token issues
export const tokenDebug = {
  // Check if token is expired
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  },

  // Get token expiration time
  getTokenExpiration(token: string): Date | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  },

  // Get time until token expires
  getTimeUntilExpiration(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp - currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  },

  // Log token info
  logTokenInfo(token: string): void {
    console.log('Token Debug Info:');
    console.log('- Is Expired:', this.isTokenExpired(token));
    console.log('- Expires At:', this.getTokenExpiration(token));
    console.log(
      '- Time Until Expiration (seconds):',
      this.getTimeUntilExpiration(token)
    );
  },

  // Check all stored tokens
  checkStoredTokens(): void {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');

    console.log('=== Stored Tokens Debug ===');

    if (token) {
      console.log('Access Token:');
      this.logTokenInfo(token);
    } else {
      console.log('No access token found');
    }

    if (refreshToken) {
      console.log('Refresh Token:');
      this.logTokenInfo(refreshToken);
    } else {
      console.log('No refresh token found');
    }
  },

  // Test token refresh manually
  async testTokenRefresh(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      console.log('❌ No refresh token found');
      return;
    }

    try {
      console.log('🔄 Testing token refresh...');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      const data = await response.json();
      console.log('🔄 Refresh test response:', data);

      if (data.success) {
        console.log('✅ Token refresh test successful');
        const { accessToken, refreshToken: newRefreshToken } = data.data.tokens;
        localStorage.setItem('token', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        console.log('✅ New tokens stored');
      } else {
        console.log('❌ Token refresh test failed:', data.error);
      }
    } catch (error) {
      console.log('❌ Token refresh test error:', error);
    }
  },
};

// Make it available globally for debugging
(window as any).tokenDebug = tokenDebug;
