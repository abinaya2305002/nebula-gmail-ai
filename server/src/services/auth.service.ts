import { OAuth2Client } from 'google-auth-library';
import { config } from '../config.js';
import { db } from '../db/database.js';
import { UserAccount, UserProfile } from '../types/index.js';

export class AuthService {
  private static oauth2Client: OAuth2Client | null = null;

  public static getOAuth2Client(): OAuth2Client | null {
    if (!config.google.clientId || !config.google.clientSecret) {
      return null;
    }
    if (!this.oauth2Client) {
      this.oauth2Client = new OAuth2Client(
        config.google.clientId,
        config.google.clientSecret,
        config.google.redirectUri
      );
    }
    return this.oauth2Client;
  }

  /**
   * Generates Google OAuth authorization URL
   */
  public static getAuthUrl(): string {
    const client = this.getOAuth2Client();
    if (!client) {
      throw new Error('Google OAuth Client ID and Secret are not configured in .env');
    }

    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: config.google.scopes,
    });
  }

  /**
   * Handles Google OAuth callback and stores user tokens
   */
  public static async handleCallback(code: string): Promise<UserProfile> {
    const client = this.getOAuth2Client();
    if (!client) {
      throw new Error('Google OAuth is not configured');
    }

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Fetch user profile from Google userinfo API
    const res = await client.request<{ id: string; email: string; name: string; picture?: string }>({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
    });

    const profile = res.data;
    const userAccount: UserAccount = {
      id: profile.id,
      email: profile.email,
      displayName: profile.name || profile.email.split('@')[0],
      avatarUrl: profile.picture,
      googleAccessToken: tokens.access_token || undefined,
      googleRefreshToken: tokens.refresh_token || undefined,
      tokenExpiresAt: tokens.expiry_date || undefined,
    };

    db.upsertUser(userAccount);

    return {
      id: userAccount.id,
      email: userAccount.email,
      displayName: userAccount.displayName,
      avatarUrl: userAccount.avatarUrl,
      isDemoUser: false,
    };
  }

  /**
   * Returns a valid OAuth2Client for the given user, refreshing tokens if needed
   */
  public static async getAuthenticatedClient(userId: string): Promise<OAuth2Client | null> {
    const user = db.getUser(userId);
    if (!user || !user.googleAccessToken) {
      return null;
    }

    const client = new OAuth2Client(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );

    client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      expiry_date: user.tokenExpiresAt,
    });

    // Check if token expired or about to expire in next 60 seconds
    const isExpired = user.tokenExpiresAt && user.tokenExpiresAt < Date.now() + 60000;
    if (isExpired && user.googleRefreshToken) {
      try {
        const { credentials } = await client.refreshAccessToken();
        db.upsertUser({
          ...user,
          googleAccessToken: credentials.access_token || user.googleAccessToken,
          tokenExpiresAt: credentials.expiry_date || user.tokenExpiresAt,
        });
      } catch (err) {
        console.error('Failed to refresh Google access token:', err);
      }
    }

    return client;
  }

  /**
   * Retrieves active user or demo fallback
   */
  public static getUser(userId?: string): UserProfile {
    if (userId) {
      const user = db.getUser(userId);
      if (user) {
        return {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isDemoUser: !user.googleAccessToken,
        };
      }
    }

    // Default to demo user
    const demo = db.getUser('demo_user_nebula');
    if (demo) {
      return {
        id: demo.id,
        email: demo.email,
        displayName: demo.displayName,
        avatarUrl: demo.avatarUrl,
        isDemoUser: true,
      };
    }

    return {
      id: 'demo_user_nebula',
      email: 'alex.developer@example.com',
      displayName: 'Alex Developer',
      isDemoUser: true,
    };
  }
}
