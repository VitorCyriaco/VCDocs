import { Controller, Post, Get, Patch, Delete, Body, Param, Request, UseGuards, ParseIntPipe } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) { }

  @Post()
  @Roles(Role.ADMIN)
  async createDepartment(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.departmentsService.createDepartment(
      createDepartmentDto.name,
      companyId,
      createDepartmentDto.description
    );
  }

  @Get('all')
  @Roles(Role.ADMIN)
  async findAll() {
    return this.departmentsService.findAll();
  }

  @Get()
  async getDepartments(@Request() req: any) {
    const companyId = req.user.companyId;
    return this.departmentsService.getDepartments(companyId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async updateDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() createDepartmentDto: CreateDepartmentDto,
  ) {
    return this.departmentsService.updateDepartment(
      id,
      createDepartmentDto.name,
      createDepartmentDto.description
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async deleteDepartment(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.deleteDepartment(id);
  }

  @Patch(':id/add-users')
  @Roles(Role.ADMIN)
  async addUsersToDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userIds: string[] },
  ) {
    return this.departmentsService.addUsersToDepartment(id, body.userIds);
  }
}