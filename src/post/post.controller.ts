import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';

import { PostService } from './post.service';

import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ParamUserDto } from './dto/param-user.dto';
import { ParamCursorDto } from './dto/param-cursor.dto';
import { ParamPostDto } from './dto/param-post.dto';

import { UserId } from 'src/decorators/user-id.decorator';

import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // 전체 피드(시간순)
  @UseGuards(JwtAuthGuard)
  @Get('/list/:cursor')
  async findAllPost(@UserId() userId: number, @Param() params: ParamCursorDto) {
    const allPost = await this.postService.getAllPost(userId, params.cursor);
    return Object.assign({
      postList: allPost,
      statusCode: 200,
      statusMsg: `게시물 전체 조회를 성공했습니다.`,
    });
  }

  // 피드 개수, 피드 작성자 수
  @UseGuards(JwtAuthGuard)
  @Get('/count')
  async findCount(@UserId() userId: number) {
    const count = await this.postService.getCount(userId);
    return Object.assign({
      postCount: count,
      statusCode: 200,
      statusMsg: `피드 수와 피드를 작성한 유저 수 불러오기에 성공했습니다.`,
    });
  }

  // 특정 유저의 피드 찾기
  @UseGuards(JwtAuthGuard)
  @Get('/mypage/:userId')
  async findPostByUser(@UserId() userId: number, @Param() params: ParamUserDto) {
    const postList = await this.postService.getPostByUser(userId, params.userId);
    return Object.assign({
      userPostList: postList,
      statusCode: 200,
      statusMsg: `유저가 작성한 피드 정보 불러오기에 성공했습니다.`,
    });
  }

  // 특정 유저가 좋아요한 피드 찾기
  @UseGuards(JwtAuthGuard)
  @Get('/like/:userId')
  async findUserLikePost(@UserId() userId: number, @Param() params: ParamUserDto) {
    const postList = await this.postService.getUserLikePost(userId, params.userId);
    return Object.assign({
      userLikePostList: postList,
      statusCode: 200,
      statusMsg: `유저가 좋아요한 피드 정보 불러오기에 성공했습니다.`,
    });
  }

  // 피드 작성
  @UseGuards(JwtAuthGuard)
  @Post('/')
  @UseInterceptors(FileInterceptor('file'))
  async createPost(@UserId() userId: number, @Body() createPostDto: CreatePostDto, @UploadedFile() file: Express.MulterS3.File) {
    await this.postService.postPost(userId, createPostDto, file);
    return Object.assign({
      statusCode: 200,
      statusMsg: `게시물 작성을 성공했습니다.`,
    });
  }

  // 피드 상세페이지
  @UseGuards(JwtAuthGuard)
  @Get('/:postId')
  async findPost(@UserId() userId: number, @Param() params: ParamPostDto) {
    const post = await this.postService.getPost(userId, params.postId);
    return Object.assign({
      post: post,
      statusCode: 200,
      statusMsg: `게시물 상세 조회를 성공했습니다.`,
    });
  }

  // 피드 수정
  @UseGuards(JwtAuthGuard)
  @Patch('/:postId')
  @UseInterceptors(FileInterceptor('file'))
  async updatePost(
    @UserId() userId: number,
    @Param() params: ParamPostDto,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file: Express.MulterS3.File,
  ) {
    await this.postService.setPost(userId, params.postId, updatePostDto, file);
    return Object.assign({
      statusCode: 200,
      statusMsg: `게시물 수정을 성공했습니다.`,
    });
  }

  // 피드 삭제
  @UseGuards(JwtAuthGuard)
  @Delete('/:postId')
  async deletePost(@UserId() userId: number, @Param() params: ParamPostDto) {
    await this.postService.delPost(userId, params.postId);
    return Object.assign({
      statusCode: 200,
      statusMsg: `게시물 삭제를 성공했습니다.`,
    });
  }
}
