import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PatchProfileDto } from './dto/patch-profile.dto';
import { ProfilesService } from './profiles.service';
import type { Request } from 'express';

type AuthedRequest = Request & { user: { userId: string; email: string } };

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get('username/:username')
  async getByUsername(@Param('username') username: string) {
    const p = await this.profiles.getByUsername(username);
    if (!p) {
      throw new NotFoundException();
    }
    return p;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: AuthedRequest) {
    const p = await this.profiles.getByUserId(req.user.userId);
    if (!p) {
      throw new NotFoundException();
    }
    return p;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async patchMe(@Req() req: AuthedRequest, @Body() dto: PatchProfileDto) {
    return this.profiles.patchByUserId(req.user.userId, dto);
  }
}
