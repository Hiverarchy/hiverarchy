import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import configuration from './config/configuration';
import { SurrealModule } from './surreal/surreal.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { InterestsModule } from './interests/interests.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { RefutationsModule } from './refutations/refutations.module';
import { TagsModule } from './tags/tags.module';
import { MediaModule } from './media/media.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      // Always load apps/api/.env whether you run Nest from repo root or apps/api
      envFilePath: resolve(__dirname, '../.env'),
    }),
    SurrealModule,
    HealthModule,
    AuthModule,
    ProfilesModule,
    InterestsModule,
    PostsModule,
    CommentsModule,
    RefutationsModule,
    TagsModule,
    MediaModule,
    AiModule,
  ],
})
export class AppModule {}
