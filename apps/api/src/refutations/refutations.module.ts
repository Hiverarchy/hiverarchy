import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import {
  PostRefutationsController,
  RefutationDeleteController,
} from './post-refutations.controller';
import { RefutationsService } from './refutations.service';

@Module({
  imports: [AuthModule, ProfilesModule],
  controllers: [PostRefutationsController, RefutationDeleteController],
  providers: [RefutationsService],
  exports: [RefutationsService],
})
export class RefutationsModule {}
