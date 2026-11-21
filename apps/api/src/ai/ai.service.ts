import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class AiService {
  constructor(
    private readonly config: ConfigService,
    private readonly posts: PostsService,
  ) {}

  async embedPost(postId: string, userId: string) {
    const apiKey = this.config.get<string>('ai.openaiApiKey')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('OPENAI_API_KEY is not configured');
    }
    const model =
      this.config.get<string>('ai.embeddingModel') ?? 'text-embedding-3-small';
    const post = await this.posts.findOne(postId);
    if (String(post.user_id) !== userId) {
      throw new ForbiddenException();
    }
    const text = [post.title, post.content ?? '', post.brief_description ?? '']
      .filter(Boolean)
      .join('\n\n')
      .trim();
    if (!text) {
      throw new BadRequestException('Nothing to embed');
    }
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, input: text }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new BadRequestException(
        `OpenAI embeddings failed: ${res.status} ${errText}`,
      );
    }
    const body = (await res.json()) as {
      data?: { embedding?: number[] }[];
    };
    const embedding = body.data?.[0]?.embedding;
    if (!embedding?.length) {
      throw new BadRequestException('No embedding in response');
    }
    return this.posts.setEmbedding(postId, embedding);
  }
}
