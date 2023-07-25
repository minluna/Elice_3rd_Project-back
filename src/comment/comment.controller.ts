import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';

import { CommentService } from './comment.service';

import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ParamCommentDto } from './dto/param-comment.dto';
import { QueryPostCursorDto } from './dto/query-postcursor.dto';

import { UserId } from 'src/decorators/user-id.decorator';

import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/')
  async createComment(@UserId() userId: number, @Body() createCommentDto: CreateCommentDto) {
    await this.commentService.postComment(userId, createCommentDto);
    return Object.assign({
      statusCode: 200,
      statusMsg: `댓글 추가하기에 성공했습니다.`,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async findComment(@UserId() userId: number, @Query() query: QueryPostCursorDto) {
    const getComment = await this.commentService.getComment(userId, query.postId, query.cursor);
    return Object.assign({
      commentListZero: getComment.CommentListZero,
      commentListOther: getComment.CommentListOther,
      statusCode: 200,
      statusMsg: `게시글 총 댓글 불러오기에 성공하셨습니다.`,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':commentId')
  async updateComment(@UserId() userId: number, @Param() params: ParamCommentDto, @Body() updateCommentDto: UpdateCommentDto) {
    await this.commentService.setComment(userId, params.commentId, updateCommentDto);
    return Object.assign({
      statusCode: 200,
      statusMsg: `댓글 수정하기에 성공했습니다.`,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  async deleteComment(@UserId() userId: number, @Param() params: ParamCommentDto) {
    await this.commentService.delComment(userId, params.commentId);
    return Object.assign({
      statusCode: 200,
      statusMsg: `댓글 삭제하기에 성공했습니다.`,
    });
  }
}
