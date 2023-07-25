import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { User } from 'src/user/entities/user.entity';
import { Post } from 'src/post/entities/post.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async getKeywordPost(userId: number, keyword: string, cursor: number) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }

      let searchPost = [];
      if (cursor == 0) {
        searchPost = await this.postRepository
          .createQueryBuilder('post')
          .leftJoin('post.postImage', 'postImage', 'post.id = postImage.postId')
          .leftJoin('post.user', 'user', 'post.userId = user.userId')
          .select([
            'post.id as postId',
            'post.userId as userId',
            'user.nickname as nickname',
            'post.content as content',
            'postImage.imageUrl as imageUrl',
          ])
          .where('post.deleteAt is NULL')
          .andWhere('user.deleteAt is NULL')
          .andWhere('post.content LIKE :keyword', { keyword: `%${keyword}%` })
          .orderBy('post.createAt', 'DESC')
          .limit(5)
          .getRawMany();
      } else if (cursor == -1) {
        searchPost = ['검색어가 포함된 게시물 조회가 끝났습니다.'];
      } else {
        searchPost = await this.postRepository
          .createQueryBuilder('post')
          .leftJoin('post.postImage', 'postImage', 'post.id = postImage.postId')
          .leftJoin('post.user', 'user', 'post.userId = user.userId')
          .select([
            'post.id as postId',
            'post.userId as userId',
            'user.nickname as nickname',
            'post.content as content',
            'postImage.imageUrl as imageUrl',
          ])
          .where('post.deleteAt is NULL')
          .andWhere('user.deleteAt is NULL')
          .andWhere('post.content LIKE :keyword', { keyword: `%${keyword}%` })
          .andWhere('post.id < :cursor', { cursor })
          .orderBy('post.createAt', 'DESC')
          .limit(5)
          .getRawMany();
      }
      return { searchPost: searchPost };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new InternalServerErrorException('키워드를 포함한 게시물 불러오기에 실패했습니다.');
      }
    }
  }
}
