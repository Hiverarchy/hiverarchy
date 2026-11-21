import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { InterestsController } from './interests.controller';
import { InterestsService } from './interests.service';

@Module({
  imports: [AuthModule, ProfilesModule],
  controllers: [InterestsController],
  providers: [InterestsService],
})
export class InterestsModule {}
