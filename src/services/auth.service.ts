import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, type IUser } from '../models/user.model';
import { ConflictError, UnauthorizedError, ValidationError } from '../utils/errors';
import type { TokenPair, JwtPayload, JwtRefreshPayload } from '../types';

const SALT_ROUNDS = 12;

export class AuthService {
  async register(email: string, password: string): Promise<{ user: IUser; tokens: TokenPair }> {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
    });

    const tokens = this.generateTokens(user);
    return { user, tokens };
  }

  async login(email: string, password: string): Promise<{ user: IUser; tokens: TokenPair }> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = this.generateTokens(user);
    return { user, tokens };
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as JwtRefreshPayload;

      if (payload.type !== 'refresh') {
        throw new UnauthorizedError('Invalid token type');
      }

      const user = await User.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-passwordHash');
  }

  private generateTokens(user: IUser): TokenPair {
    const accessToken = jwt.sign(
      { sub: user._id.toString(), email: user.email } as Omit<JwtPayload, 'iat' | 'exp'>,
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpiresIn }
    );

    const refreshToken = jwt.sign(
      { sub: user._id.toString(), type: 'refresh' } as Omit<JwtRefreshPayload, 'iat' | 'exp'>,
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  sanitizeUser(user: IUser): Omit<IUser, 'passwordHash'> & { passwordHash?: never } {
    const obj = user.toObject();
    delete obj.passwordHash;
    return obj;
  }
}

export const authService = new AuthService();
