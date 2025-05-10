import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { JwtPayload } from './jwt-payload.interface';
import * as bcrypt from 'bcryptjs';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

  async login(user: User) {
    const payload: JwtPayload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.password === password) { // Aqui deve ser feito o hash da senha no futuro
      return user;
    }
    return null;
  }

  async register(dto: RegisterUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email já registrado');

    const hash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hash,
        role: dto.role,
        companyId: dto.companyId,
        departments: {
          connect: dto.departments.map((id) => ({ id })),
        },
      },
      include: {
        departments: true,
      },
    });

    return { id: user.id, email: user.email, role: user.role };
  }

  async updateUser(id: string, dto: Partial<RegisterUserDto>) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        departments: dto.departments
          ? {
              set: [],
              connect: dto.departments.map((id) => ({ id })),
            }
          : undefined,
      },
    });
  }
}
