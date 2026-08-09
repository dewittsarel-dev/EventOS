import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AssetManagementModule } from './asset-management/asset-management.module';
import { CapabilityModule } from './capabilities/capability.module';
import { CommercialWorkspacesModule } from './commercial-workspaces/commercial-workspaces.module';
import { ContactsModule } from './contacts/contacts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EventExecutionModule } from './event-execution/event-execution.module';
import { EventLifecycleModule } from './event-lifecycle/event-lifecycle.module';
import { EventDesignModule } from './event-design/event-design.module';
import { EventsModule } from './events/events.module';
import { FinanceControlModule } from './finance-control/finance-control.module';
import { InventoryModule } from './inventory/inventory.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { MeetingNotesModule } from './meeting-notes/meeting-notes.module';
import { MoodBoardsModule } from './mood-boards/mood-boards.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { ProcurementModule } from './procurement/procurement.module';
import { QuotationsModule } from './quotations/quotations.module';
import { RequirementsModule } from './requirements/requirements.module';
import { ResourcesModule } from './resources/resources.module';
import { SupplierProductsModule } from './supplier-products/supplier-products.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { TasksModule } from './tasks/tasks.module';
import { appConfig } from './config/app.config';
import { OrganizationModule } from './organizations/organization.module';
import { PrismaModule } from './prisma/prisma.module';
import { RequestObservabilityMiddleware } from './observability/request-observability.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'],
      load: [appConfig],
    }),
    CapabilityModule,
    CommercialWorkspacesModule,
    PrismaModule,
    OrganizationModule,
    AuthModule,
    AssetManagementModule,
    DashboardModule,
    ContactsModule,
    MarketplaceModule,
    EventDesignModule,
    EventExecutionModule,
    EventLifecycleModule,
    EventsModule,
    FinanceControlModule,
    InventoryModule,
    ResourcesModule,
    PurchaseOrdersModule,
    ProcurementModule,
    MeetingNotesModule,
    MoodBoardsModule,
    SuppliersModule,
    SupplierProductsModule,
    QuotationsModule,
    RequirementsModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestObservabilityMiddleware).forRoutes('*');
  }
}
