import { Module } from '@nestjs/common';
import { RESOURCE_ENGINE_PORT } from './resource-engine.port';
import { ResourceEngineService } from './resource-engine.service';
import { ResourcesController } from './resources.controller';

@Module({
  controllers: [ResourcesController],
  providers: [
    ResourceEngineService,
    {
      provide: RESOURCE_ENGINE_PORT,
      useExisting: ResourceEngineService,
    },
  ],
  exports: [ResourceEngineService, RESOURCE_ENGINE_PORT],
})
export class ResourcesModule {}
