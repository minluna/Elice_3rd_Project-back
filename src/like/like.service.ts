import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { Like } from './entities/like.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async postLike(userId: number, postId: number) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }

      const checkLike = Boolean(await this.likeRepository.findOne({ where: { userId: userId, postId: postId } }));
      if (checkLike) {
        throw new NotFoundException('해당 게시물에는 이미 사용자의 좋아요가 있습니다.');
      }

      const like = new Like();
      like.userId = userId;
      like.postId = postId;
      await this.likeRepository.save(like);
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('좋아요 목록 생성에 실패하였습니다.');
      }
    }
  }

  async getLike(userId: number, postId: number) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }

      const likeUser = Boolean(await this.likeRepository.findOne({ where: { userId: userId, postId: postId } }));
      const likeCount = await this.likeRepository
        .createQueryBuilder()
        .select('COUNT(id) as likeCount')
        .where('postId = :postId', { postId })
        .getRawOne();

      return { likeUser: likeUser, likeCount: likeCount.likeCount };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new InternalServerErrorException('좋아요 여부 확인 및 좋아요 누적수 불러오기에 실패했습니다.');
      }
    }
  }

  async delLike(userId: number, postId: number) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }

      const checkLike = Boolean(await this.likeRepository.findOne({ where: { userId: userId, postId: postId } }));
      if (!checkLike) {
        throw new NotFoundException('해당 게시물에는 사용자의 좋아요가 없습니다.');
      }

      const deletedLike = await this.likeRepository.delete({ userId: userId, postId: postId });
      if (deletedLike.affected === 0) {
        // 조건에 맞는 데이터가 없어서 업데이트가 실패한 경우
        throw new UnauthorizedException('좋아요를 누른 유저만 삭제할 수 있습니다.');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('좋아요 목록 삭제에 실패하였습니다.');
      }
    }
  }
}
