import {
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
import { CreateInterestDto } from './dto/create-interest.dto';
import { PatchInterestDto } from './dto/patch-interest.dto';
import { InterestsService } from './interests.service';
import type { Request } from 'express';

type AuthedRequest = Request & { user: { userId: string; email: string } };

@Controller('interests')
export class InterestsController {
  constructor(private readonly interests: InterestsService) {}

  @Get('by-username/:username')
  listByUsername(
    @Param('username') username: string,
    @Query('include_inactive') includeInactive?: string,
  ) {
    return this.interests.listByUsername(
      username,
      includeInactive === '1' || includeInactive === 'true',
    );
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  create(@Req() req: AuthedRequest, @Body() dto: CreateInterestDto) {
    return this.interests.create(req.user.userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  patch(
    @Param('id') id: string,
    @Req() req: AuthedRequest,
    @Body() dto: PatchInterestDto,
  ) {
    return this.interests.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.interests.remove(id, req.user.userId);
  }
}
