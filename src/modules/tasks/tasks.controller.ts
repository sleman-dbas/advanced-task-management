import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createDto: CreateTaskDto, @Req() req: Request) {
    return this.tasksService.create(createDto, req.user as any);
  }

  @Get()
  findAll(@Req() req: Request, @Query('projectId') projectId?: string) {
    return this.tasksService.findAll(req.user as any, projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.tasksService.findOne(id, req.user as any);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateTaskDto, @Req() req: Request) {
    return this.tasksService.update(id, updateDto, req.user as any);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.tasksService.remove(id, req.user as any);
  }
}