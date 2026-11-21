import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SurrealService } from '../surreal/surreal.service';
import type { CreatePostDto } from './dto/create-post.dto';
import type { PatchPostDto } from './dto/patch-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly surreal: SurrealService) {}

  async findOne(idParam: string) {
    const raw = await this.surreal.db
      .query(
        'SELECT * FROM posts WHERE id = type::thing("posts", $part) LIMIT 1',
        {
          part: idParam.includes(':') ? idParam.split(':').pop()! : idParam,
        },
      )
      .collect();
    const list = raw[0] as Record<string, unknown>[] | undefined;
    const row = list?.[0];
    if (!row) {
      throw new NotFoundException('Post not found');
    }
    return this.serialize(row);
  }

  async listForArc(arcId: string) {
    const part = arcId.includes(':') ? arcId.split(':').pop()! : arcId;
    const raw = await this.surreal.db
      .query(
        'SELECT * FROM posts WHERE arc_id = $part OR id = type::thing("posts", $part) ORDER BY created_at ASC',
        { part },
      )
      .collect();
    const list = raw[0] as Record<string, unknown>[] | undefined;
    return (list ?? []).map((r) => this.serialize(r));
  }

  async listByParent(parentId: string) {
    const part = parentId.includes(':') ? parentId.split(':').pop()! : parentId;
    const raw = await this.surreal.db
      .query(
        'SELECT * FROM posts WHERE parent_id = $p OR parent_id = type::thing("posts", $part) ORDER BY created_at ASC',
        { p: parentId, part },
      )
      .collect();
    const list = raw[0] as Record<string, unknown>[] | undefined;
    return (list ?? []).map((r) => this.serialize(r));
  }

  async listByInterestName(name: string) {
    const raw = await this.surreal.db
      .query(
        'SELECT * FROM posts WHERE interest_names != NONE AND array::contains(interest_names, $name) ORDER BY created_at DESC',
        { name },
      )
      .collect();
    const list = raw[0] as Record<string, unknown>[] | undefined;
    return (list ?? []).map((r) => this.serialize(r));
  }

  async listByUserId(userId: string) {
    const raw = await this.surreal.db
      .query(
        'SELECT * FROM posts WHERE user_id = $uid ORDER BY created_at DESC',
        { uid: userId },
      )
      .collect();
    const list = raw[0] as Record<string, unknown>[] | undefined;
    return (list ?? []).map((r) => this.serialize(r));
  }

  async create(dto: CreatePostDto, userId: string) {
    const parentId = dto.parent_id?.trim() || undefined;
    const arcForInsert = parentId ? (dto.arc_id ?? '') : randomUUID();

    const raw = await this.surreal.db
      .query(
        `CREATE posts SET
          user_id = $uid,
          title = $title,
          content = $content,
          brief_description = $bd,
          excerpt = $bd,
          arc_id = $arc,
          parent_id = $parent,
          interest_ids = $iids,
          interest_names = $inames,
          tag_ids = $tids,
          tag_names = $tnames,
          interests = $interests,
          post_writer = $pw,
          created_at = time::now(),
          updated_at = time::now()
        RETURN AFTER`,
        {
          uid: userId,
          title: dto.title,
          content: dto.content ?? '',
          bd: dto.brief_description ?? '',
          arc: arcForInsert,
          parent: parentId ?? null,
          iids: dto.interest_ids ?? [],
          inames: dto.interest_names ?? [],
          tids: dto.tag_ids ?? [],
          tnames: dto.tag_names ?? [],
          interests: dto.interests ?? [],
          pw: dto.post_writer ?? null,
        },
      )
      .collect();

    const first = raw[0] as Record<string, unknown>[] | undefined;
    const row = first?.[0];
    if (!row) {
      throw new InternalServerErrorException('Could not create post');
    }
    if (!parentId) {
      const idStr = String(row.id);
      const part = idStr.includes(':') ? idStr.split(':').pop()! : idStr;
      await this.surreal.db.query(
        'UPDATE type::thing("posts", $part) SET arc_id = $aid, updated_at = time::now()',
        { part, aid: idStr },
      );
    }
    return this.findOne(String(row.id));
  }

  async update(idParam: string, dto: PatchPostDto, userId: string) {
    const existing = await this.findOne(idParam);
    if (String(existing.user_id) !== userId) {
      throw new ForbiddenException();
    }
    const part = idParam.includes(':') ? idParam.split(':').pop()! : idParam;
    const sets: string[] = [];
    const params: Record<string, unknown> = { part };
    if (dto.title !== undefined) {
      sets.push('title = $title');
      params.title = dto.title;
    }
    if (dto.content !== undefined) {
      sets.push('content = $content');
      params.content = dto.content;
    }
    if (dto.brief_description !== undefined) {
      sets.push('brief_description = $bd');
      sets.push('excerpt = $bd');
      params.bd = dto.brief_description;
    }
    if (dto.interest_ids !== undefined) {
      sets.push('interest_ids = $iids');
      params.iids = dto.interest_ids;
    }
    if (dto.interest_names !== undefined) {
      sets.push('interest_names = $inames');
      params.inames = dto.interest_names;
    }
    if (dto.tag_ids !== undefined) {
      sets.push('tag_ids = $tids');
      params.tids = dto.tag_ids;
    }
    if (dto.tag_names !== undefined) {
      sets.push('tag_names = $tnames');
      params.tnames = dto.tag_names;
    }
    if (dto.post_writer !== undefined) {
      sets.push('post_writer = $pw');
      params.pw = dto.post_writer;
    }
    if (sets.length === 0) {
      return existing;
    }
    sets.push('updated_at = time::now()');
    await this.surreal.db.query(
      `UPDATE type::thing("posts", $part) SET ${sets.join(', ')}`,
      params,
    );
    return this.findOne(idParam);
  }

  async remove(idParam: string, userId: string) {
    const existing = await this.findOne(idParam);
    if (String(existing.user_id) !== userId) {
      throw new ForbiddenException();
    }
    const part = idParam.includes(':') ? idParam.split(':').pop()! : idParam;
    await this.surreal.db.query('DELETE type::thing("posts", $part)', {
      part,
    });
  }

  private serialize(row: Record<string, unknown>) {
    return {
      id: String(row.id),
      user_id: row.user_id,
      title: row.title,
      content: row.content ?? null,
      excerpt: row.excerpt ?? null,
      brief_description: row.brief_description ?? row.excerpt ?? null,
      arc_id: row.arc_id ?? null,
      parent_id: row.parent_id ?? null,
      interests: row.interests ?? [],
      interest_ids: row.interest_ids ?? [],
      interest_names: row.interest_names ?? [],
      tag_ids: row.tag_ids ?? [],
      tag_names: row.tag_names ?? [],
      post_writer: row.post_writer ?? null,
      embedding: row.embedding ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      images: [],
    };
  }

  async setEmbedding(postId: string, embedding: number[]) {
    const part = postId.includes(':') ? postId.split(':').pop()! : postId;
    await this.surreal.db.query(
      'UPDATE type::thing("posts", $part) SET embedding = $emb, updated_at = time::now()',
      { part, emb: embedding },
    );
    return this.findOne(postId);
  }
}
