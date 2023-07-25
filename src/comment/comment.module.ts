import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';

import { Comment } from './entities/comment.entity';
import { User } from '../user/entities/user.entity';
import { Post } from '../post/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, User, Post])],
  exports: [TypeOrmModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
