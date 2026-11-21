import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import type { Request } from 'express';

type AuthedRequest = Request & { user: { userId: string; email: string } };

@Controller('posts')
export class PostCommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get(':id/comments')
  list(@Param('id') id: string) {
    return this.comments.findByPost(id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('id') id: string,
    @Req() req: AuthedRequest,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.create(id, req.user.userId, dto);
  }
}

@Controller('comments')
export class CommentDeleteController {
  constructor(private readonly comments: CommentsService) {}

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.comments.remove(id, req.user.userId);
  }
}
