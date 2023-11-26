import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { Contract } from '@prisma/client';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @IsPublic()
  @Post()
  create(@Body() contract: Contract) {
    return this.contractsService.create(
      contract,
      contract.clientId,
      contract.employeeId,
      contract.estateId,
    );
  }

  @Get()
  findAll(): Promise<Contract[]> {
    return this.contractsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Contract> {
    return this.contractsService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() contract: Contract,
  ): Promise<Contract> {
    return this.contractsService.update(+id, contract);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.contractsService.remove(+id);
  }
}
