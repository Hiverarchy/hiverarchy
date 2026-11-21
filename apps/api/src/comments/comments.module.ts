import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import {
  CommentDeleteController,
  PostCommentsController,
} from './post-comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [AuthModule, ProfilesModule],
  controllers: [PostCommentsController, CommentDeleteController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
