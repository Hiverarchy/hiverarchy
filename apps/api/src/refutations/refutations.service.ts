import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SurrealService } from '../surreal/surreal.service';
import { surrealValueToString } from '../surreal/value-string';
import {
  ProfilesService,
  type ProfileView,
} from '../profiles/profiles.service';
import type { CreateRefutationDto } from './dto/create-refutation.dto';

@Injectable()
export class RefutationsService {
  constructor(
    private readonly surreal: SurrealService,
    private readonly profiles: ProfilesService,
  ) {}

  private async postExists(postId: string): Promise<boolean> {
    const part = postId.includes(':') ? postId.split(':').pop()! : postId;
    const raw = await this.surreal.db
      .query(
        'SELECT id FROM posts WHERE id = type::thing("posts", $part) LIMIT 1',
        { part },
      )
      .collect();
    const list = raw[0] as unknown[] | undefined;
    return Array.isArray(list) && list.length > 0;
  }

  async findByPost(postId: string) {
    const pid = String(postId);
    const raw = await this.surreal.db
      .query(
        'SELECT * FROM refutations WHERE post_id = $pid ORDER BY created_at ASC',
        { pid },
      )
      .collect();
    const rows = (raw[0] as Record<string, unknown>[]) ?? [];
    const profIds = [
      ...new Set(rows.map((r) => surrealValueToString(r.profile_id))),
    ];
    const profileCache = new Map<string, ProfileView | null>();
    for (const id of profIds) {
      if (!id) continue;
      const p = await this.profiles.getById(id);
      profileCache.set(id, p);
    }
    return rows.map((row) => {
      const profId = surrealValueToString(row.profile_id);
      const prof = profileCache.get(profId);
      return {
        id: surrealValueToString(row.id),
        post_id: row.post_id,
        profile_id: row.profile_id,
        parent_id: row.parent_id ?? null,
        content: row.content,
        created_at: row.created_at,
        user_id: prof?.user_id ?? null,
        profile: prof
          ? {
              id: prof.id,
              username: prof.username,
              email: prof.email,
            }
          : { id: profId, username: null, email: null },
      };
    });
  }

  async create(postId: string, userId: string, dto: CreateRefutationDto) {
    if (!(await this.postExists(postId))) {
      throw new NotFoundException('Post not found');
    }
    const profile = await this.profiles.getByUserId(userId);
    if (!profile) {
      throw new ForbiddenException('Profile required');
    }
    const profileRid = profile.id;
    const raw = await this.surreal.db
      .query(
        `CREATE refutations SET post_id = $pid, profile_id = $prof, content = $c, parent_id = $par, created_at = time::now() RETURN AFTER`,
        {
          pid: String(postId),
          prof: profileRid,
          c: dto.content.trim(),
          par: dto.parent_id?.trim() ? String(dto.parent_id.trim()) : null,
        },
      )
      .collect();
    const first = raw[0] as Record<string, unknown>[] | undefined;
    const row = first?.[0];
    if (!row) {
      throw new NotFoundException('Could not create refutation');
    }
    return {
      id: surrealValueToString(row.id),
      post_id: row.post_id,
      profile_id: row.profile_id,
      parent_id: row.parent_id ?? null,
      content: row.content,
      created_at: row.created_at,
      user_id: profile.user_id,
      profile: {
        id: profileRid,
        username: profile.username,
        email: profile.email,
      },
    };
  }

  async remove(refutationId: string, userId: string) {
    const part = refutationId.includes(':')
      ? refutationId.split(':').pop()!
      : refutationId;
    const raw = await this.surreal.db
      .query(
        'SELECT * FROM refutations WHERE id = type::thing("refutations", $part) LIMIT 1',
        { part },
      )
      .collect();
    const list = raw[0] as Record<string, unknown>[] | undefined;
    const row = list?.[0];
    if (!row) {
      throw new NotFoundException('Refutation not found');
    }
    const profile = await this.profiles.getByUserId(userId);
    if (
      !profile ||
      surrealValueToString(row.profile_id) !== surrealValueToString(profile.id)
    ) {
      throw new ForbiddenException();
    }
    await this.surreal.db.query('DELETE type::thing("refutations", $part)', {
      part,
    });
  }
}
