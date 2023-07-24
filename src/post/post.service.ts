import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { User } from 'src/user/entities/user.entity';
import { PostImage } from './entities/post-image.entity';
import { Point } from 'src/user/entities/point.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(PostImage)
    private postImageRepository: Repository<PostImage>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getAllPost(userId: number, cursor: number) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }

      let posts = [];
      if (cursor == 0) {
        posts = await this.postRepository
          .createQueryBuilder('post')
          .leftJoin('post.postImage', 'postImage', 'post.id = postImage.postId')
          .leftJoin('post.user', 'user', 'post.userId = user.userId')
          .leftJoin('user.userImage', 'userImage', 'user.userId = userImage.userId')
          .select([
            'post.id as postId',
            'post.userId as userId',
            'user.nickname as nickname',
            'post.content as content',
            'postImage.imageUrl as imageUrl',
            'userImage.imageUrl as userImage',
            'post.createAt as createAt',
          ])
          .where('post.deleteAt is NULL')
          .andWhere('user.deleteAt is NULL')
          .orderBy('post.createAt', 'DESC')
          .limit(5)
          .getRawMany();
      } else if (cursor == -1) {
        posts = ['전체 게시물 조회가 끝났습니다.'];
      } else {
        posts = await this.postRepository
          .createQueryBuilder()
          .leftJoin('post.postImage', 'postImage', 'post.id = postImage.postId')
          .leftJoin('post.user', 'user', 'post.userId = user.userId')
          .leftJoin('user.userImage', 'userImage', 'user.userId = userImage.userId')
          .select([
            'post.id as postId',
            'post.userId as userId',
            'user.nickname as nickname',
            'post.content as content',
            'postImage.imageUrl as imageUrl',
            'userImage.imageUrl as userImage',
            'post.createAt as createAt',
          ])
          .where('post.deleteAt is NULL')
          .andWhere('user.deleteAt is NULL')
          .andWhere('post.id < :cursor', { cursor })
          .orderBy('post.createAt', 'DESC')
          .limit(5)
          .getRawMany();
      }
      return { posts: posts };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new InternalServerErrorException('게시물 전체 조회를 실패했습니다.');
      }
    }
  }

  async getCount(userId: number) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }

      const count = await this.postRepository
        .createQueryBuilder()
        .select(['COUNT(id) as postCount', 'COUNT(DISTINCT post.userId) as userCount'])
        .where('DATE_FORMAT(post.createAt, "%Y-%m-%d") = CURDATE()')
        .getRawOne();

      return { postCount: count.postCount, userCount: count.userCount };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new InternalServerErrorException('피드 수와 피드를 작성한 유저 수 불러오기에 실패했습니다.');
      }
    }
  }

  async getPostByUser(userId: number, postUserId: number) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }

      const userPostList = await this.postRepository
        .createQueryBuilder('post')
        .leftJoin('post.postImage', 'postImage', 'post.id = postImage.postId')
        .select(['post.id as postId', 'postImage.imageUrl as imageUrl'])
        .where('post.deleteAt is NULL')
        .andWhere('post.userId = :postUserId', { postUserId })
        .orderBy('post.createAt', 'DESC')
        .getRawMany();

      return userPostList;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new InternalServerErrorException('유저가 작성한 피드 정보 불러오기에 실패했습니다.');
      }
    }
  }

  async getUserLikePost(userId: number, likeUserId: number) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }

      const userLikePostList = await this.postRepository
        .createQueryBuilder('post')
        .leftJoin('post.postImage', 'postImage', 'post.id = postImage.postId')
        .select(['post.id as postId', 'postImage.imageUrl as imageUrl'])
        .where('post.deleteAt is NULL')
        .andWhere('post.id IN (SELECT postId FROM post_like where userId = :likeUserId)', { likeUserId })
        .orderBy('post.createAt', 'DESC')
        .getRawMany();

      return userLikePostList;
    } catch (error) {
      console.log(error);
      if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new InternalServerErrorException('유저가 좋아요한 피드 정보 불러오기에 실패했습니다.');
      }
    }
  }

  async postPost(userId: number, createPostDto: CreatePostDto, file: Express.MulterS3.File) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }

      const post = new Post();
      post.userId = userId;
      post.content = createPostDto.content;
      const createdPost = await this.postRepository.save(post);

      const postImage = new PostImage();
      postImage.postId = createdPost.id;
      postImage.imageUrl = file.location;
      await this.postImageRepository.save(postImage);

      await this.userRepository
        .createQueryBuilder()
        .update(Point)
        .set({ currentPoint: () => 'currentPoint + 1000', accuPoint: () => 'accuPoint + 1000' })
        .where('userId = :userId', { userId })
        .andWhere('3 >= (select count(id) from post where userId = :userId and DATE_FORMAT(createAt, "%Y-%m-%d") = CURDATE())', {
          userId,
        })
        .execute();
    } catch (error) {
      console.log(error);
      if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new InternalServerErrorException('게시물 작성을 실패했습니다.');
      }
    }
  }

  async getPost(userId: number, postId: number) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }

      const checkPost = await this.postRepository.findOne({ where: { id: postId, deleteAt: IsNull() } });
      if (!checkPost) {
        throw new NotFoundException('요청한 게시물의 정보를 찾을 수 없습니다.');
      }

      const post = await this.postRepository
        .createQueryBuilder('post')
        .leftJoin('post.postImage', 'postImage', 'post.id = postImage.postId')
        .leftJoin('post.user', 'user', 'post.userId = user.userId')
        .leftJoin('user.userImage', 'userImage', 'user.userId = userImage.userId')
        .select([
          'post.id as postId',
          'post.userId as userId',
          'user.nickname as nickname',
          'post.content as content',
          'postImage.imageUrl as imageUrl',
          'userImage.imageUrl as userImage',
          'post.createAt as createAt',
        ])
        .where('post.deleteAt is NULL')
        .andWhere('user.deleteAt is NULL')
        .andWhere('post.id = :postId', { postId })
        .getRawOne();

      return post;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('게시물 상세 조회를 실패했습니다.');
      }
    }
  }

  async setPost(userId: number, postId: number, updatePostDto: UpdatePostDto, file: Express.MulterS3.File) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }

      const checkPost = await this.postRepository.findOne({ where: { id: postId, deleteAt: IsNull() } });
      if (!checkPost) {
        throw new NotFoundException('요청한 게시물의 정보를 찾을 수 없습니다.');
      }

      const updatedPost = await this.postRepository.update({ userId: userId, id: postId }, updatePostDto);
      if (updatedPost.affected === 0) {
        // 조건에 맞는 데이터가 없어서 업데이트가 실패한 경우
        throw new UnauthorizedException('게시물 작성자만 수정할 수 있습니다.');
      }
      await this.postImageRepository.update({ postId: postId }, { imageUrl: file.location });
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('게시물 수정을 실패했습니다.');
      }
    }
  }

  async delPost(userId: number, postId: number) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }

      const checkPost = await this.postRepository.findOne({ where: { id: postId, deleteAt: IsNull() } });
      if (!checkPost) {
        throw new NotFoundException('요청한 게시물의 정보를 찾을 수 없습니다.');
      }

      const deletedPost = await this.postRepository.softDelete({ userId: userId, id: postId });
      if (deletedPost.affected === 0) {
        // 조건에 맞는 데이터가 없어서 업데이트가 실패한 경우
        throw new UnauthorizedException('게시물 작성자만 삭제할 수 있습니다.');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('게시물 삭제를 실패했습니다.');
      }
    }
  }
}
