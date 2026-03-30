import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';
import { User } from 'src/database/entities/user.entity';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createDto: CreateCommentDto,
    @Req() req: Request,
  ) {
    const user = req.user as User; // استخراج المستخدم من الـ JWT
    return this.commentsService.create(createDto, user);
  }
}
