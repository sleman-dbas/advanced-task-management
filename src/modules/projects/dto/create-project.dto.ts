import { IsString, IsOptional, IsDateString, IsArray, IsUUID } from 'class-validator';
import { ProjectStatus } from '../../../database/entities/project.entity';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  memberIds?: string[];
}