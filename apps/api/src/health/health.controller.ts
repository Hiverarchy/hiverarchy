import { Controller, Get } from '@nestjs/common';
import { SurrealService } from '../surreal/surreal.service';

@Controller('health')
export class HealthController {
  constructor(private readonly surrealService: SurrealService) {}

  @Get()
  live() {
    return { status: 'ok' };
  }

  @Get('surreal')
  async surrealStatus() {
    const version = await this.surrealService.version();
    return { status: 'ok', surreal: version };
  }
}
