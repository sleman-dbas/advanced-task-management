import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';
import { Task } from 'src/database/entities/task.entity'; // adjust path as needed

// Swagger imports
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully', type: Task })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – user cannot create task in this project' })
  create(@Body() createDto: CreateTaskDto, @Req() req: Request) {
    return this.tasksService.create(createDto, req.user as any);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks accessible by the user' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter tasks by project ID' })
  @ApiResponse({ status: 200, description: 'List of tasks', type: [Task] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Req() req: Request, @Query('projectId') projectId?: string) {
    return this.tasksService.findAll(req.user as any, projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task details', type: Task })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – user cannot access this task' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.tasksService.findOne(id, req.user as any);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully', type: Task })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – user cannot modify this task' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTaskDto,
    @Req() req: Request,
  ) {
    return this.tasksService.update(id, updateDto, req.user as any);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – user cannot delete this task' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.tasksService.remove(id, req.user as any);
  }
}