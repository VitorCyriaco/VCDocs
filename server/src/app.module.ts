import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DocumentsModule } from './documents/documents.module';
import { DepartmentsModule } from './departments/departments.module';

@Module({
  imports: [AuthModule, DepartmentsModule, UsersModule, DocumentsModule],
  providers: [PrismaService],
})
export class AppModule {}
