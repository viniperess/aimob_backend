import { Controller, Get, Query } from '@nestjs/common';
import { CreciService } from './creci.service';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
@Controller('creci')
export class CreciController {
  constructor(private readonly creciService: CreciService) {}
  @IsPublic()
  @Get('validate')
  async validateCreci(@Query('creci') creci: string) {
    if (!creci) {
      throw new Error('CRECI é obrigatório');
    }
    return this.creciService.validateCreci(creci);
  }
}
