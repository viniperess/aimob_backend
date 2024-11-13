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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@prisma/client';
import { IsPublic } from '../auth/decorators/is-public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

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
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() user: User,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<User> {
    return this.usersService.create(user, image);
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
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: number,
    @Body() user: User,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<User | null> {
    return this.usersService.update(+id, user, image);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.usersService.remove(+id);
  }
}
