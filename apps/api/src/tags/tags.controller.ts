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
import { CreateTagDto } from './dto/create-tag.dto';
import { TagsService } from './tags.service';
import type { Request } from 'express';

type AuthedRequest = Request & { user: { userId: string; email: string } };

@Controller('tags')
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Get('by-username/:username')
  listByUsername(@Param('username') username: string) {
    return this.tags.listByUsername(username);
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  create(@Req() req: AuthedRequest, @Body() dto: CreateTagDto) {
    return this.tags.create(req.user.userId, dto.name);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.tags.remove(id, req.user.userId);
  }
}
