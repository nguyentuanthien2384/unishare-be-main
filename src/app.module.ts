import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DocumentsModule } from './documents/documents.module';
import { AdminModule } from './admin/admin.module';
import { StatisticsModule } from './statistics/statistics.module';
import { LogsModule } from './logs/logs.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    DocumentsModule,
    AdminModule,
    StatisticsModule,
    LogsModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
