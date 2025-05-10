import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Department } from '@prisma/client';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) { }

  async createDepartment(name: string, companyId: string, description?: string): Promise<Department> {
    return this.prisma.department.create({
      data: {
        name,
        description,
        companyId,
      },
    });
  }

  async findAll() {
    return this.prisma.department.findMany({
      include: {
        categories: true,
      }
    });
  }

  async getDepartments(companyId: string): Promise<Department[]> {
    return this.prisma.department.findMany({
      where: { companyId },
      include: {
        categories: true,
      }
    });
  }

  async updateDepartment(id: number, name: string, description?: string): Promise<Department> {
    const department = await this.prisma.department.findUnique({ where: { id } });

    if (!department) {
      throw new NotFoundException('Departamento não encontrado.');
    }

    return this.prisma.department.update({
      where: { id },
      data: {
        name,
        description,
      },
      include: { categories: true }
    });
  }

  async deleteDepartment(id: number): Promise<void> {
    const department = await this.prisma.department.findUnique({ where: { id } });

    if (!department) {
      throw new NotFoundException('Departamento não encontrado.');
    }

    await this.prisma.department.delete({ where: { id } });
  }

  async addUsersToDepartment(departmentId: number, userIds: string[]): Promise<Department> {
    const department = await this.prisma.department.findUnique({ where: { id: departmentId } });

    if (!department) {
      throw new NotFoundException('Departamento não encontrado.');
    }

    return this.prisma.department.update({
      where: { id: departmentId },
      data: {
        users: {
          connect: userIds.map(id => ({ id })),
        },
      },
      include: { users: { select: { id: true, name: true, email: true } } }
    });
  }
}