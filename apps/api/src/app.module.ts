import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { EventsModule } from './events/events.module';
import { QuotationsModule } from './quotations/quotations.module';
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
    PrismaModule,
    OrganizationModule,
    AuthModule,
    ContactsModule,
    EventsModule,
    QuotationsModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
