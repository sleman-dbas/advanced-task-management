import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ProjectStatus } from '../../../database/entities/project.entity';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}