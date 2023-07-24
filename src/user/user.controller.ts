import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';

import { UserService } from './user.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ParamUserDto } from './dto/param-user.dto';

import { UserId } from '../decorators/user-id.decorator';

import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 회원가입
  @Post('register')
  async create(@Body() createUserDto: CreateUserDto) {
    await this.userService.create(createUserDto);
    return Object.assign({
      statusCode: 200,
      statusMsg: `회원가입이 성공적으로 완료되었습니다.`,
    });
  }

  // 로그인
  @Post('login')
  async login(@Body() { email, password }: LoginUserDto) {
    const loginUser = await this.userService.login(email, password);
    return Object.assign({
      data: { userId: loginUser.userId, token: loginUser.token },
      statusCode: 200,
      statusMsg: `로그인이 성공적으로 완료되었습니다.`,
    });
  }

  // 로그인 검증
  @UseGuards(JwtAuthGuard)
  @Get('isLogin')
  async isLogin(@UserId() userId: number) {
    const checkUser = await this.userService.isLogin(userId);
    return Object.assign({
      data: checkUser,
      statusCode: 200,
      statusMsg: `정상적인 유저입니다.`,
    });
  }

  // 전체 유저 수
  @UseGuards(JwtAuthGuard)
  @Get('userCount')
  async findManyCount(@UserId() userId: number) {
    const userCount = await this.userService.getAllCount(userId);
    return Object.assign({
      data: userCount,
      statusCode: 200,
      statusMsg: `전체 유저 수 불러오기가 성공적으로 완료되었습니다.`,
    });
  }

  // 유저의 누적 포인트
  @UseGuards(JwtAuthGuard)
  @Get('point')
  async findPoint(@UserId() userId: number) {
    const userPoint = await this.userService.getPoint(userId);
    return Object.assign({
      data: userPoint,
      statusCode: 200,
      statusMsg: `유저 포인트 내역 불러오기가 성공적으로 완료되었습니다.`,
    });
  }

  // 유저 정보 찾기
  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async findUser(@Param() params: ParamUserDto) {
    const foundUser = await this.userService.getUser(params.userId);
    return Object.assign({
      data: foundUser,
      statusCode: 200,
      statusMsg: `유저 정보 불러오기가 성공적으로 완료되었습니다.`,
    });
  }

  // 유저 정보 수정
  @UseGuards(JwtAuthGuard)
  @Patch(':userId')
  @UseInterceptors(FileInterceptor('file'))
  async updateUser(
    @Param() params: ParamUserDto,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.MulterS3.File,
  ) {
    await this.userService.setUser(params.userId, updateUserDto, file);
    return Object.assign({
      data: { ...updateUserDto },
      statusCode: 200,
      statusMsg: `유저 정보 수정하기가 성공적으로 완료되었습니다.`,
    });
  }

  // 유저 정보 삭제
  @UseGuards(JwtAuthGuard)
  @Delete(':userId')
  async deleteUser(@Param() params: ParamUserDto) {
    await this.userService.delUser(params.userId);
    return Object.assign({
      statusCode: 200,
      statusMsg: `유저 정보 삭제하기가 성공적으로 완료되었습니다.`,
    });
  }
}
