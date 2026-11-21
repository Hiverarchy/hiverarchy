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
import { RefutationsService } from './refutations.service';
import { CreateRefutationDto } from './dto/create-refutation.dto';
import type { Request } from 'express';

type AuthedRequest = Request & { user: { userId: string; email: string } };

@Controller('posts')
export class PostRefutationsController {
  constructor(private readonly refutations: RefutationsService) {}

  @Get(':id/refutations')
  list(@Param('id') id: string) {
    return this.refutations.findByPost(id);
  }

  @Post(':id/refutations')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('id') id: string,
    @Req() req: AuthedRequest,
    @Body() dto: CreateRefutationDto,
  ) {
    return this.refutations.create(id, req.user.userId, dto);
  }
}

@Controller('refutations')
export class RefutationDeleteController {
  constructor(private readonly refutations: RefutationsService) {}

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.refutations.remove(id, req.user.userId);
  }
}
