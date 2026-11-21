import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SurrealService } from '../surreal/surreal.service';

export type ProfileView = {
  id: string;
  user_id: string;
  email: unknown;
  username: unknown;
  tagline: unknown;
  logo: unknown;
  resume: unknown;
  now: unknown;
  created_at: unknown;
  updated_at: unknown;
};

@Injectable()
export class ProfilesService {
  constructor(private readonly surreal: SurrealService) {}

  serialize(row: Record<string, unknown>): ProfileView {
    return {
      id: String(row.id),
      user_id: String(row.user_id),
      email: row.email,
      username: row.username,
      tagline: row.tagline ?? null,
      logo: row.logo ?? null,
      resume: row.resume ?? null,
      now: row.now_md ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async getByUsername(username: string): Promise<ProfileView | null> {
    const raw = await this.surreal.db
      .query('SELECT * FROM profiles WHERE username = $u LIMIT 1', {
        u: username.toLowerCase(),
      })
      .collect();
    const list = raw[0] as Record<string, unknown>[] | undefined;
    const row = list?.[0];
    return row ? this.serialize(row) : null;
  }

  async getByUserId(userId: string): Promise<ProfileView | null> {
    const raw = await this.surreal.db
      .query('SELECT * FROM profiles WHERE user_id = $uid LIMIT 1', {
        uid: userId,
      })
      .collect();
    const list = raw[0] as Record<string, unknown>[] | undefined;
    const row = list?.[0];
    return row ? this.serialize(row) : null;
  }

  /** Resolve by profile record id (e.g. `profiles:…`). */
  async getById(profileRecordId: string): Promise<ProfileView | null> {
    const part = profileRecordId.includes(':')
      ? profileRecordId.split(':').pop()!
      : profileRecordId;
    const raw = await this.surreal.db
      .query(
        'SELECT * FROM profiles WHERE id = type::thing("profiles", $part) LIMIT 1',
        { part },
      )
      .collect();
    const list = raw[0] as Record<string, unknown>[] | undefined;
    const row = list?.[0];
    return row ? this.serialize(row) : null;
  }

  async patchByUserId(
    userId: string,
    patch: {
      username?: string;
      tagline?: string;
      logo?: string;
      resume?: string;
      now?: string;
    },
  ): Promise<ProfileView> {
    const existing = await this.getByUserId(userId);
    if (!existing) {
      throw new NotFoundException('Profile not found');
    }
    const sets: string[] = [];
    const params: Record<string, unknown> = { uid: userId };
    if (patch.username !== undefined) {
      const u = patch.username.toLowerCase();
      const clash = await this.getByUsername(u);
      if (clash && String(clash.user_id) !== String(userId)) {
        throw new ConflictException('Username already taken');
      }
      sets.push('username = $username');
      params.username = u;
    }
    if (patch.tagline !== undefined) {
      sets.push('tagline = $tagline');
      params.tagline = patch.tagline;
    }
    if (patch.logo !== undefined) {
      sets.push('logo = $logo');
      params.logo = patch.logo;
    }
    if (patch.resume !== undefined) {
      sets.push('resume = $resume');
      params.resume = patch.resume;
    }
    if (patch.now !== undefined) {
      sets.push('now_md = $now_md');
      params.now_md = patch.now;
    }
    if (sets.length === 0) {
      return existing;
    }
    await this.surreal.db.query(
      `UPDATE profiles SET ${sets.join(', ')}, updated_at = time::now() WHERE user_id = $uid`,
      params,
    );
    const next = await this.getByUserId(userId);
    if (!next) {
      throw new NotFoundException('Profile not found');
    }
    return next;
  }
}
