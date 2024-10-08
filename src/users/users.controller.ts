import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@prisma/client';
import { IsPublic } from '../auth/decorators/is-public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @IsPublic()
  @Post()
  create(@Body() user: User): Promise<User> {
    return this.usersService.create(user);
  }

  @IsPublic()
  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @IsPublic()
  @Get(':id')
  findOne(@Param('id') id: number): Promise<User | null> {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() user: User): Promise<User | null> {
    return this.usersService.update(+id, user);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.usersService.remove(+id);
  }
}
