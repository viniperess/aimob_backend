import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Request,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { Employee } from '@prisma/client';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(@Body() employee: Employee, @Request() req) {
    return this.employeesService.create(employee, req.user.id);
  }

  @Get()
  findAll(): Promise<Employee[]> {
    return this.employeesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Employee | null> {
    return this.employeesService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() employee: Employee,
  ): Promise<Employee | null> {
    return this.employeesService.update(+id, employee);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.employeesService.remove(+id);
  }
}
