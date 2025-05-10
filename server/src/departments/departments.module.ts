import { Module } from '@nestjs/common';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { DocumentsController } from '../documents/documents.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [DepartmentsController, DocumentsController],
  providers: [DepartmentsService, PrismaService, DocumentsService],
})
export class DepartmentsModule {}
