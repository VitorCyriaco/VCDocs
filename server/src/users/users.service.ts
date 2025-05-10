import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { RegisterUserDto } from 'src/auth/dto/register-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
  
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        companyId: data.companyId,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { departments: true },
    });
  }

  async findAllByCompany(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateUser(id: string, data: Partial<RegisterUserDto>) {
    // Verificando se departamentos foram fornecidos
    const { departments, ...restData } = data;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...restData, // Atualizando outros dados como nome, email, etc.
        departments: departments
          ? {
              // Atualizando ou criando relacionamento entre o usuário e os departamentos
              connect: departments.map(departmentId => ({ id: departmentId })),
            }
          : undefined, // Se não houver departamentos, não atualize esse campo
      },
    });
  }
}
