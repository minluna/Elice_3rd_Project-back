import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { User } from 'src/user/entities/user.entity';

@Injectable()
export class RankService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getRankList(userId: number) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }

      const rankList = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.userImage', 'userImage', 'user.userId = userImage.userId')
        .leftJoin('user.point', 'point', 'user.userId = point.userId')
        .select([
          'user.userId as userId',
          'user.nickname as nickname',
          'userImage.imageUrl as userImage',
          'point.accuPoint as accuPoint',
          '(SELECT COUNT(id) FROM post WHERE post.userId = user.userId AND post.deleteAt is NULL) as storyCount',
        ])
        .where('user.deleteAt is NULL')
        .orderBy('point.accuPoint', 'DESC')
        .addOrderBy('storyCount', 'DESC')
        .addOrderBy('user.createAt', 'DESC')
        .limit(10)
        .getRawMany();

      return { rankList };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Top10 랭킹 리스트 불러오기에 실패했습니다.');
      }
    }
  }
}
