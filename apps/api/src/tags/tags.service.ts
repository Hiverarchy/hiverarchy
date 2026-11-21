import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SurrealService } from '../surreal/surreal.service';
import {
  ProfilesService,
  type ProfileView,
} from '../profiles/profiles.service';

@Injectable()
export class TagsService {
  constructor(
    private readonly surreal: SurrealService,
    private readonly profiles: ProfilesService,
  ) {}

  async listByUsername(username: string) {
    const profile = await this.profiles.getByUsername(username);
    if (!profile) {
      return [];
    }
    return this.listByProfile(profile);
  }

  async listByProfile(profile: ProfileView) {
    const pid = profile.id;
    const raw = await this.surreal.db
      .query('SELECT * FROM tags WHERE profile_id = $pid ORDER BY name ASC', {
        pid,
      })
      .collect();
    const rows = (raw[0] as Record<string, unknown>[]) ?? [];
    return rows.map((row) => this.serialize(row, profile));
  }

  async create(userId: string, name: string) {
    const profile = await this.profiles.getByUserId(userId);
    if (!profile) {
      throw new ForbiddenException('Profile required');
    }
    const n = name.trim().toLowerCase();
    if (!n) {
      throw new BadRequestException('Name required');
    }
    const pid = profile.id;
    const raw = await this.surreal.db
      .query(
        `CREATE tags SET profile_id = $pid, name = $name, created_at = time::now() RETURN AFTER`,
        { pid, name: n },
      )
      .collect();
    const row = (raw[0] as Record<string, unknown>[] | undefined)?.[0];
    if (!row) {
      throw new NotFoundException('Could not create tag');
    }
    return this.serialize(row, profile);
  }

  async remove(tagId: string, userId: string) {
    const profile = await this.profiles.getByUserId(userId);
    if (!profile) {
      throw new ForbiddenException('Profile required');
    }
    const existing = await this.findOneForProfile(tagId, profile.id);
    if (!existing) {
      throw new NotFoundException('Tag not found');
    }
    const part = tagId.includes(':') ? tagId.split(':').pop()! : tagId;
    await this.surreal.db.query('DELETE type::thing("tags", $part)', { part });
  }

  private async findOneForProfile(
    tagId: string,
    profileId: string,
  ): Promise<Record<string, unknown> | null> {
    const part = tagId.includes(':') ? tagId.split(':').pop()! : tagId;
    const raw = await this.surreal.db
      .query(
        'SELECT * FROM tags WHERE id = type::thing("tags", $part) AND profile_id = $pid LIMIT 1',
        { part, pid: profileId },
      )
      .collect();
    const list = raw[0] as Record<string, unknown>[] | undefined;
    return list?.[0] ?? null;
  }

  private serialize(row: Record<string, unknown>, profile: ProfileView) {
    return {
      id: String(row.id),
      user_id: profile.user_id,
      profile_id: row.profile_id ?? profile.id,
      name: row.name,
      created_at: row.created_at,
    };
  }
}
