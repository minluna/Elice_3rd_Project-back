import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserImage } from './entities/user-image.entity';
import { Point } from './entities/point.entity';

import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import 'dotenv/config';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserImage)
    private userImageRepository: Repository<UserImage>,
    @InjectRepository(Point)
    private pointRepository: Repository<Point>,
    private readonly jwtService: JwtService,
  ) {}

  // 회원가입
  async create(createUserDto: CreateUserDto) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { email: createUserDto.email, deleteAt: IsNull() },
      });
      if (existUser) {
        throw new ConflictException('이 이메일은 현재 사용중입니다. 다른 이메일을 입력해 주세요.');
      }
      createUserDto.password = await bcrypt.hash(createUserDto.password, parseInt(process.env.PW_HASH_COUNT));

      const { imageUrl, ...dtoWithoutImageUrl } = createUserDto;
      const createdUser = await this.userRepository.save(dtoWithoutImageUrl);

      const userImage = new UserImage();
      userImage.userId = createdUser.userId;
      userImage.imageUrl = imageUrl;
      await this.userImageRepository.save(userImage);

      const point = new Point();
      point.userId = createdUser.userId;
      point.currentPoint = 0;
      point.accuPoint = 0;
      await this.pointRepository.save(point);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      } else {
        throw new BadRequestException('회원가입에 실패했습니다.');
      }
    }
  }

  // 로그인
  async login(email: string, password: string) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { email: email, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new NotFoundException('해당 이메일은 가입 내역이 없습니다. 다시 한 번 확인해 주세요.');
      }
      const correctPasswordHash = existUser.password;
      const isPasswordCorrect = await bcrypt.compare(password, correctPasswordHash);
      if (!isPasswordCorrect) {
        throw new UnauthorizedException('비밀번호가 일치하지 않습니다. 다시 한 번 확인해 주세요.');
      }

      const payload = {
        userId: existUser.userId,
        email: existUser.email,
        nickname: existUser.nickname,
        description: existUser.description,
      };
      const token = this.jwtService.sign(payload);

      return { userId: existUser.userId, token: token };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new UnauthorizedException('로그인에 실패하셨습니다.');
      }
    }
  }

  // 로그인 검증
  async isLogin(userId: number) {
    const existUser = await this.userRepository.findOne({
      where: { userId, deleteAt: IsNull() },
    });
    if (!existUser) {
      throw new NotFoundException('요청한 사용자의 정보를 찾을 수 없습니다.');
    }
    return { userId: existUser.userId, email: existUser.email, nickname: existUser.nickname };
  }

  // 전체 유저 수
  async getAllCount(userId: number) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }
      const users = await this.userRepository.find({ where: { deleteAt: IsNull() } });
      const count = users.length;
      return { userCount: count };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new InternalServerErrorException('전체 유저 수 불러오기에 실패했습니다.');
      }
    }
  }

  // 유저의 누적 포인트
  async getPoint(userId: number) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }
      const existUserImage = await this.userImageRepository.findOne({
        where: { userId },
      });
      if (!existUserImage) {
        throw new NotFoundException('요청한 사용자의 이미지를 찾을 수 없습니다.');
      }
      const point = await this.pointRepository.findOne({
        where: { userId },
      });
      if (!point) {
        throw new NotFoundException('요청한 사용자의 포인트를 찾을 수 없습니다.');
      }
      return {
        userPoint: {
          userId: existUser.userId,
          nickname: existUser.nickname,
          imageUrl: existUserImage.imageUrl,
          accuPoint: point.accuPoint,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('유저 포인트 내역 불러오기에 실패했습니다.');
      }
    }
  }

  // 유저 정보 찾기
  async getUser(userId: number) {
    try {
      const foundUser = await this.userRepository.findOne({ where: { userId, deleteAt: IsNull() } });
      if (!foundUser) throw new NotFoundException('요청한 사용자의 정보를 찾을 수 없습니다.');

      const userInfo = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.point', 'point', 'user.userId = point.userId')
        .leftJoin('user.userImage', 'userImage', 'user.userId = userImage.userId')
        .select([
          'user.userId as userId',
          'user.email as email',
          'user.nickname as nickname',
          'user.description as description',
          'user.createAt as createAt',
          'userImage.imageUrl as userImage',
          'point.accuPoint as accuPoint',
          '(SELECT count(id) FROM post WHERE post.userId = user.userId AND post.deleteAt is NULL) as storyCount',
        ])
        .where('user.userId = :userId', { userId })
        .andWhere('user.deleteAt is NULL')
        .getRawMany();
      if (!userInfo) {
        throw new NotFoundException('유저의 정보를 찾을 수 없습니다.');
      }

      const AccuRanking = await this.pointRepository
        .createQueryBuilder()
        .select('rankings.AccuRanking as AccuRanking')
        .from((subQuery) => {
          return subQuery
            .select(['ROW_NUMBER() OVER (ORDER BY accuPoint DESC) as AccuRanking', 'user.userId as userId'])
            .from('point', 'point')
            .innerJoin('point.user', 'user', 'user.userId = point.userId')
            .where('user.deleteAt IS NULL');
        }, 'rankings')
        .where('rankings.userId = :userId', { userId })
        .getRawOne();
      if (!AccuRanking) {
        throw new NotFoundException('유저의 게시물 랭킹순위를 찾을 수 없습니다.');
      }

      const TodayRanking = await this.pointRepository
        .createQueryBuilder()
        .select('rankings.TodayRanking as TodayRanking')
        .from((subQuery) => {
          return subQuery
            .select([
              'ROW_NUMBER() OVER (ORDER BY subquery.storyCount DESC, subquery.accuPoint DESC) as TodayRanking',
              'subquery.userId as userId',
            ])
            .from((subQuery) => {
              return subQuery
                .select([
                  'user.userId as userId',
                  'point.accuPoint as accuPoint',
                  '(SELECT COUNT(userId) FROM post WHERE post.userId = user.userId and DATE_FORMAT(post.createAt, "%Y-%m-%d") = CURDATE()) as storyCount',
                ])
                .from('user', 'user')
                .leftJoin('user.userImage', 'userImage', 'user.userId = userImage.userId')
                .leftJoin('user.point', 'point', 'user.userId = point.userId')
                .where('user.deleteAt is NULL');
            }, 'subquery');
        }, 'rankings')
        .where('rankings.userId = :userId', { userId })
        .getRawOne();
      if (!TodayRanking) {
        throw new NotFoundException('유저의 오늘 랭킹순위를 찾을 수 없습니다.');
      }

      return {
        userInfo: {
          userId: userInfo[0].userId,
          email: userInfo[0].email,
          nickname: userInfo[0].nickname,
          userImage: userInfo[0].userImage,
          description: userInfo[0].description,
          accuPoint: userInfo[0].accuPoint,
          storyCount: userInfo[0].storyCount,
          createAt: userInfo[0].createAt,
          AccuRanking: AccuRanking.AccuRanking,
          TodayRanking: TodayRanking.TodayRanking,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('유저 정보 불러오기에 실패했습니다.');
      }
    }
  }

  // 유저 정보 수정
  async setUser(userId: number, updateUserDto: UpdateUserDto, file: Express.MulterS3.File) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new NotFoundException('요청한 사용자의 정보를 찾을 수 없습니다.');
      }
      await this.userRepository.update(userId, updateUserDto);
      await this.userImageRepository.update({ userId: userId }, { imageUrl: file.location });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('유저 정보 수정하기에 실패했습니다.');
      }
    }
  }

  // 유저 정보 삭제
  async delUser(userId: number) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new NotFoundException('요청한 사용자의 정보를 찾을 수 없습니다.');
      }
      await this.userRepository.softDelete(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('유저 정보 삭제하기에 실패했습니다.');
      }
    }
  }
}
