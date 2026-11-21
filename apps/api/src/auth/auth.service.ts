import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { SurrealService } from '../surreal/surreal.service';
import { surrealValueToString } from '../surreal/value-string';
import { ProfilesService } from '../profiles/profiles.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

export type JwtPayload = { sub: string; email: string };

function baseUsernameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'user';
  const slug = local.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
  return (slug || 'user').slice(0, 28);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly surreal: SurrealService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly profiles: ProfilesService,
  ) {}

  private async ensureUniqueUsername(base: string): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const candidate =
        i === 0 ? base : `${base}${Math.floor(1000 + Math.random() * 9000)}`;
      const raw = await this.surreal.db
        .query('SELECT username FROM profiles WHERE username = $u LIMIT 1', {
          u: candidate,
        })
        .collect();
      const list = raw[0] as Array<{ username: string }> | undefined;
      if (!list?.length) {
        return candidate;
      }
    }
    return `${base}${Date.now().toString(36)}`;
  }

  async register(dto: RegisterDto) {
    const password_hash = await bcrypt.hash(dto.password, 12);
    const requested = dto.username?.trim().toLowerCase();
    const base = (requested || baseUsernameFromEmail(dto.email)).toLowerCase();
    const username = await this.ensureUniqueUsername(base);
    try {
      const raw = await this.surreal.db
        .query(
          'CREATE users SET email = $email, password_hash = $hash RETURN id, email',
          { email: dto.email, hash: password_hash },
        )
        .collect();
      const firstStatement = raw[0] as
        | Array<{ id: unknown; email: string }>
        | undefined;
      const row = Array.isArray(firstStatement) ? firstStatement[0] : undefined;
      if (!row?.id) {
        throw new ConflictException('Could not create user');
      }
      const uid = surrealValueToString(row.id);
      try {
        await this.surreal.db.query(
          'CREATE profiles SET user_id = $uid, email = $email, username = $username',
          { uid, email: dto.email, username },
        );
      } catch (profileErr) {
        await this.surreal.db.query('DELETE users WHERE id = $id', {
          id: row.id,
        });
        throw profileErr;
      }
      return this.issueTokens(uid, dto.email);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.includes('unique') ||
        msg.includes('already') ||
        msg.includes('idx_users_email')
      ) {
        throw new ConflictException('Email already registered');
      }
      throw e;
    }
  }

  async login(dto: LoginDto) {
    const raw = await this.surreal.db
      .query(
        'SELECT id, password_hash FROM users WHERE email = $email LIMIT 1',
        { email: dto.email },
      )
      .collect();
    const list = raw[0] as
      | Array<{ id: unknown; password_hash: string }>
      | undefined;
    const user = list?.[0];
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.password_hash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(surrealValueToString(user.id), dto.email);
  }

  private issueTokens(sub: string, email: string) {
    const payload: JwtPayload = { sub, email };
    const access_token = this.jwt.sign(payload);
    return {
      access_token,
      token_type: 'Bearer' as const,
      expires_in: this.config.get<string>('jwt.expiresIn') ?? '7d',
    };
  }

  async getMe(userId: string) {
    const raw = await this.surreal.db
      .query('SELECT id, email FROM users WHERE id = $id LIMIT 1', {
        id: userId,
      })
      .collect();
    const list = raw[0] as Array<{ id: unknown; email: string }> | undefined;
    const u = list?.[0];
    if (!u) {
      throw new UnauthorizedException();
    }
    const profile = await this.profiles.getByUserId(userId);
    return {
      user: { id: surrealValueToString(u.id), email: u.email },
      profile,
    };
  }
}
