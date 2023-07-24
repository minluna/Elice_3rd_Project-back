import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

  async create(createUserDto: CreateUserDto) {
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
  }

  async login(email: string, password: string) {
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
  }

  async isLogin(userId: number) {
    const existUser = await this.userRepository.findOne({
      where: { userId, deleteAt: IsNull() },
    });
    if (!existUser) {
      throw new NotFoundException('요청한 사용자의 정보를 찾을 수 없습니다.');
    }
    const existUserImage = await this.userImageRepository.findOne({
      where: { userId },
    });
    // userImage가 없을 때 에러처리 넣을 것
    return { userId: existUser.userId, email: existUser.email, nickname: existUser.nickname, userImage: existUserImage.imageUrl };
  }

  async getAllCount(userId: number) {
    const existUser = await this.userRepository.findOne({
      where: { userId, deleteAt: IsNull() },
    });
    if (!existUser) {
      throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
    }
    const users = await this.userRepository.find({ where: { deleteAt: IsNull() } });
    const count = users.length;
    return { userCount: count };
  }

  async getPoint(userId: number) {
    const existUser = await this.userRepository.findOne({
      where: { userId, deleteAt: IsNull() },
    });
    if (!existUser) {
      throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
    }
    const existUserImage = await this.userImageRepository.findOne({
      where: { userId },
    });
    // userImage가 없을 때 에러처리 넣을 것
    const point = await this.pointRepository.findOne({
      where: { userId },
    });
    // point가 없을 때 에러처리 넣을 것
    console.log(existUser);
    console.log(point);
    return {
      userId: existUser.userId,
      nickname: existUser.nickname,
      imageUrl: existUserImage.imageUrl,
      accuPoint: point.accuPoint,
    };
  }

  async findOne(userId: number) {
    const foundUser = await this.userRepository.findOne({ where: { userId, deleteAt: IsNull() } });
    if (!foundUser) throw new NotFoundException('요청한 사용자의 정보를 찾을 수 없습니다.');

    const userInfo = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.point', 'point', 'user.userId = point.userId')
      .leftJoin('user.user_image', 'userImage', 'user.userId = userImage.userId')
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
              .leftJoin('user.user_image', 'userImage', 'user.userId = userImage.userId')
              .leftJoin('user.point', 'point', 'user.userId = point.userId')
              .where('user.deleteAt is NULL');
          }, 'subquery');
      }, 'rankings')
      .where('rankings.userId = :userId', { userId })
      .getRawOne();

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
  }

  async update(userId: number, updateUserDto: UpdateUserDto, file: Express.MulterS3.File) {
    const existUser = await this.userRepository.findOne({
      where: { userId, deleteAt: IsNull() },
    });
    if (!existUser) {
      throw new NotFoundException('요청한 사용자의 정보를 찾을 수 없습니다.');
    }
    await this.userRepository.update(userId, updateUserDto);
    await this.userImageRepository.update({ userId: userId }, { imageUrl: file.location });
  }

  async remove(userId: number) {
    const existUser = await this.userRepository.findOne({
      where: { userId, deleteAt: IsNull() },
    });
    if (!existUser) {
      throw new NotFoundException('요청한 사용자의 정보를 찾을 수 없습니다.');
    }
    await this.userRepository.softDelete(userId);
  }
}
