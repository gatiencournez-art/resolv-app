import { Module } from '@nestjs/common';
import { SlaPoliciesService } from './sla-policies.service';
import { SlaPoliciesController } from './sla-policies.controller';

@Module({
  controllers: [SlaPoliciesController],
  providers: [SlaPoliciesService],
  exports: [SlaPoliciesService],
})
export class SlaPoliciesModule {}
