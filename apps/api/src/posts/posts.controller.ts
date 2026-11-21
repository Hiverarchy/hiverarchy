import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { PatchPostDto } from './dto/patch-post.dto';
import { PostsService } from './posts.service';
import type { Request } from 'express';

type AuthedRequest = Request & { user: { userId: string; email: string } };

@Controller('posts')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Get()
  list(
    @Query('arc_id') arcId?: string,
    @Query('parent_id') parentId?: string,
    @Query('interest_name') interestName?: string,
    @Query('user_id') userId?: string,
  ) {
    if (userId?.trim()) {
      return this.posts.listByUserId(userId.trim());
    }
    if (interestName?.trim()) {
      return this.posts.listByInterestName(interestName.trim());
    }
    if (parentId?.trim()) {
      return this.posts.listByParent(parentId.trim());
    }
    if (!arcId?.trim()) {
      throw new BadRequestException(
        'Provide arc_id, parent_id, interest_name, or user_id',
      );
    }
    return this.posts.listForArc(arcId.trim());
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: AuthedRequest, @Body() dto: CreatePostDto) {
    return this.posts.create(dto, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  patch(
    @Param('id') id: string,
    @Req() req: AuthedRequest,
    @Body() dto: PatchPostDto,
  ) {
    return this.posts.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.posts.remove(id, req.user.userId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.posts.findOne(id);
  }
}
