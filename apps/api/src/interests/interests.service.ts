import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SurrealService } from '../surreal/surreal.service';
import {
  ProfilesService,
  type ProfileView,
} from '../profiles/profiles.service';
import type { CreateInterestDto } from './dto/create-interest.dto';
import type { PatchInterestDto } from './dto/patch-interest.dto';

@Injectable()
export class InterestsService {
  constructor(
    private readonly surreal: SurrealService,
    private readonly profiles: ProfilesService,
  ) {}

  async listByUsername(username: string, includeInactive: boolean) {
    const profile = await this.profiles.getByUsername(username);
    if (!profile) {
      return [];
    }
    const pid = profile.id;
    const raw = await this.surreal.db
      .query(
        'SELECT * FROM interests WHERE profile_id = $pid ORDER BY sequence ASC, title ASC',
        { pid },
      )
      .collect();
    const list = raw[0] as Record<string, unknown>[] | undefined;
    const rows = list ?? [];
    const filtered = includeInactive
      ? rows
      : rows.filter((r) => r.is_active !== false);
    return filtered.map((row) => this.serialize(row, profile));
  }

  async create(userId: string, dto: CreateInterestDto) {
    const profile = await this.profiles.getByUserId(userId);
    if (!profile) {
      throw new ForbiddenException('Profile required');
    }
    const pid = profile.id;
    let seq = dto.sequence;
    if (seq === undefined) {
      const seqRaw = await this.surreal.db
        .query(
          'SELECT sequence FROM interests WHERE profile_id = $pid ORDER BY sequence DESC LIMIT 1',
          { pid },
        )
        .collect();
      const top = (seqRaw[0] as Record<string, unknown>[] | undefined)?.[0];
      const n = top?.sequence;
      seq = typeof n === 'number' ? n + 1 : 0;
    }
    const raw = await this.surreal.db
      .query(
        `CREATE interests SET
          profile_id = $pid,
          title = $title,
          description = $desc,
          content = $content,
          image_path = $img,
          route_path = $route,
          name = $name,
          sequence = $seq,
          is_active = $active,
          created_at = time::now(),
          updated_at = time::now()
        RETURN AFTER`,
        {
          pid,
          title: dto.title,
          desc: dto.description ?? null,
          content: dto.content ?? null,
          img: dto.image_path ?? '/images/default.jpg',
          route: dto.route_path ?? '',
          name: dto.name ?? null,
          seq,
          active: dto.is_active !== false,
        },
      )
      .collect();
    const row = (raw[0] as Record<string, unknown>[] | undefined)?.[0];
    if (!row) {
      throw new NotFoundException('Could not create interest');
    }
    return this.serialize(row, profile);
  }

  async update(interestId: string, userId: string, dto: PatchInterestDto) {
    const profile = await this.profiles.getByUserId(userId);
    if (!profile) {
      throw new ForbiddenException('Profile required');
    }
    const existing = await this.findOneForProfile(interestId, profile.id);
    if (!existing) {
      throw new NotFoundException('Interest not found');
    }
    const part = interestId.includes(':')
      ? interestId.split(':').pop()!
      : interestId;
    const sets: string[] = [];
    const params: Record<string, unknown> = { part };
    if (dto.title !== undefined) {
      sets.push('title = $title');
      params.title = dto.title;
    }
    if (dto.description !== undefined) {
      sets.push('description = $description');
      params.description = dto.description;
    }
    if (dto.content !== undefined) {
      sets.push('content = $content');
      params.content = dto.content;
    }
    if (dto.image_path !== undefined) {
      sets.push('image_path = $image_path');
      params.image_path = dto.image_path;
    }
    if (dto.route_path !== undefined) {
      sets.push('route_path = $route_path');
      params.route_path = dto.route_path;
    }
    if (dto.name !== undefined) {
      sets.push('name = $name');
      params.name = dto.name;
    }
    if (dto.sequence !== undefined) {
      sets.push('sequence = $sequence');
      params.sequence = dto.sequence;
    }
    if (dto.is_active !== undefined) {
      sets.push('is_active = $is_active');
      params.is_active = dto.is_active;
    }
    if (sets.length === 0) {
      return this.serialize(existing, profile);
    }
    sets.push('updated_at = time::now()');
    await this.surreal.db.query(
      `UPDATE type::thing("interests", $part) SET ${sets.join(', ')}`,
      params,
    );
    const next = await this.findOneForProfile(interestId, profile.id);
    if (!next) {
      throw new NotFoundException('Interest not found');
    }
    return this.serialize(next, profile);
  }

  async remove(interestId: string, userId: string) {
    const profile = await this.profiles.getByUserId(userId);
    if (!profile) {
      throw new ForbiddenException('Profile required');
    }
    const existing = await this.findOneForProfile(interestId, profile.id);
    if (!existing) {
      throw new NotFoundException('Interest not found');
    }
    const part = interestId.includes(':')
      ? interestId.split(':').pop()!
      : interestId;
    await this.surreal.db.query('DELETE type::thing("interests", $part)', {
      part,
    });
  }

  private async findOneForProfile(
    interestId: string,
    profileId: string,
  ): Promise<Record<string, unknown> | null> {
    const part = interestId.includes(':')
      ? interestId.split(':').pop()!
      : interestId;
    const raw = await this.surreal.db
      .query(
        'SELECT * FROM interests WHERE id = type::thing("interests", $part) AND profile_id = $pid LIMIT 1',
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
      title: row.title,
      description: row.description ?? null,
      content: row.content ?? null,
      image_path: row.image_path ?? '/images/default.jpg',
      route_path: row.route_path ?? '',
      name: row.name ?? null,
      sequence: row.sequence ?? 0,
      is_active: row.is_active !== false,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
