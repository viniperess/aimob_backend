import { PartialType } from '@nestjs/mapped-types';
import { CreateRealestateDto } from './create-realestate.dto';

export class UpdateRealestateDto extends PartialType(CreateRealestateDto) {}
