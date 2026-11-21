import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import type { Request } from 'express';

type AuthedRequest = Request & { user: { userId: string; email: string } };

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('embed-post/:postId')
  @UseGuards(JwtAuthGuard)
  embedPost(@Param('postId') postId: string, @Req() req: AuthedRequest) {
    return this.ai.embedPost(postId, req.user.userId);
  }
}
