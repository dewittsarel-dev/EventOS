import { Module } from '@nestjs/common';
import { CommercialWorkspacesController } from './commercial-workspaces.controller';
import { CommercialWorkspacesService } from './commercial-workspaces.service';

@Module({
  controllers: [CommercialWorkspacesController],
  providers: [CommercialWorkspacesService],
})
export class CommercialWorkspacesModule {}
