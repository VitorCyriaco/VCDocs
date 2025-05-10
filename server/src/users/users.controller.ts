import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Request,
  } from '@nestjs/common';
  import { UsersService } from './users.service';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  
  @Controller('users')
  @UseGuards(JwtAuthGuard)
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    @Post()
    async create(@Body() body: any, @Request() req: any) {
      const user = req.user;
      if (user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
      }
  
      return this.usersService.create({
        ...body,
        companyId: user.companyId,
      });
    }
  
    @Get()
    async findAll(@Request() req: any) {
      return this.usersService.findAllByCompany(req.user.companyId);
    }
  }
  