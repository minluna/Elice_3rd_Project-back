import { Controller, Get, Post, Param, Delete, UseGuards } from '@nestjs/common';

import { LikeService } from './like.service';

import { ParamPostDto } from './dto/param-post.dto';

import { UserId } from 'src/decorators/user-id.decorator';

import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';

@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':postId')
  async createLike(@UserId() userId: number, @Param() params: ParamPostDto) {
    await this.likeService.postLike(userId, params.postId);
    return Object.assign({
      statusCode: 200,
      statusMsg: `좋아요 목록 생성에 성공하셨습니다.`,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':postId')
  async findLike(@UserId() userId: number, @Param() params: ParamPostDto) {
    const like = await this.likeService.getLike(userId, params.postId);
    return Object.assign({
      likecount: like.likeCount,
      likeuser: like.likeUser,
      statusCode: 200,
      statusMsg: `좋아요 여부 확인 및 좋아요 누적수 불러오기에 성공했습니다.`,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':postId')
  async deleteLike(@UserId() userId: number, @Param() params: ParamPostDto) {
    await this.likeService.delLike(userId, params.postId);
    return Object.assign({
      statusCode: 200,
      statusMsg: `좋아요 목록 삭제에 성공하였습니다.`,
    });
  }
}
