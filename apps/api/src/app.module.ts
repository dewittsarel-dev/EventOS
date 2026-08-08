import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CapabilityModule } from './capabilities/capability.module';
import { ContactsModule } from './contacts/contacts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EventExecutionModule } from './event-execution/event-execution.module';
import { EventsModule } from './events/events.module';
import { InventoryModule } from './inventory/inventory.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { MeetingNotesModule } from './meeting-notes/meeting-notes.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { QuotationsModule } from './quotations/quotations.module';
import { ResourcesModule } from './resources/resources.module';
import { SupplierProductsModule } from './supplier-products/supplier-products.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { TasksModule } from './tasks/tasks.module';
import { appConfig } from './config/app.config';
import { OrganizationModule } from './organizations/organization.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'],
      load: [appConfig],
    }),
    CapabilityModule,
    PrismaModule,
    OrganizationModule,
    AuthModule,
    DashboardModule,
    ContactsModule,
    MarketplaceModule,
    EventExecutionModule,
    EventsModule,
    InventoryModule,
    ResourcesModule,
    PurchaseOrdersModule,
    MeetingNotesModule,
    SuppliersModule,
    SupplierProductsModule,
    QuotationsModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
