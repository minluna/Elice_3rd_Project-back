import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';
import { User } from 'src/user/entities/user.entity';
import { Post } from 'src/post/entities/post.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async postComment(userId: number, createCommentDto: CreateCommentDto) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }

      const comment = new Comment();
      comment.userId = userId;
      comment.postId = createCommentDto.postId;
      comment.content = createCommentDto.content;
      comment.parentId = createCommentDto.parentId;
      await this.commentRepository.save(comment);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new InternalServerErrorException('댓글 추가하기에 실패했습니다.');
      }
    }
  }

  async getComment(userId: number, postId: number, cursor: number) {
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

      let CommentListZero = [];
      let CommentListOther = [];
      if (cursor == 0) {
        CommentListZero = await this.commentRepository
          .createQueryBuilder('comment')
          .leftJoin('comment.user', 'user', 'comment.userId = user.userId')
          .leftJoin('user.userImage', 'userImage', 'user.userId=userImage.userId')
          .select([
            'comment.id as commentId',
            'comment.userId as userId',
            'user.nickname as nickname',
            'userImage.imageUrl as imageUrl',
            'comment.content as content',
            'comment.parentId as parentId',
            'comment.createAt as createAt',
          ])
          .where('comment.deleteAt is NULL')
          .andWhere('user.deleteAt is NULL')
          .andWhere('comment.parentId = 0')
          .andWhere('comment.postId = :postId', { postId })
          .orderBy('comment.createAt', 'DESC')
          .limit(10)
          .getRawMany();

        CommentListOther = await this.commentRepository
          .createQueryBuilder('comment')
          .leftJoin('comment.user', 'user', 'comment.userId = user.userId')
          .leftJoin('user.userImage', 'userImage', 'user.userId=userImage.userId')
          .select([
            'comment.id as commentId',
            'comment.userId as userId',
            'user.nickname as nickname',
            'userImage.imageUrl as imageUrl',
            'comment.content as content',
            'comment.parentId as parentId',
            'comment.createAt as createAt',
          ])
          .where('comment.deleteAt is NULL')
          .andWhere('user.deleteAt is NULL')
          .andWhere('comment.parentId != 0')
          .andWhere('comment.postId = :postId', { postId })
          .orderBy('comment.createAt', 'DESC')
          .getRawMany();
      } else if (cursor == -1) {
        CommentListZero = ['전체 댓글 조회가 끝났습니다.'];
        CommentListOther = ['전체 댓글 조회가 끝났습니다.'];
      } else {
        CommentListZero = await this.commentRepository
          .createQueryBuilder('comment')
          .leftJoin('comment.user', 'user', 'comment.userId = user.userId')
          .leftJoin('user.userImage', 'userImage', 'user.userId=userImage.userId')
          .select([
            'comment.id as commentId',
            'comment.userId as userId',
            'user.nickname as nickname',
            'userImage.imageUrl as imageUrl',
            'comment.content as content',
            'comment.parentId as parentId',
            'comment.createAt as createAt',
          ])
          .where('comment.deleteAt is NULL')
          .andWhere('user.deleteAt is NULL')
          .andWhere('comment.parentId = 0')
          .andWhere('comment.postId = :postId', { postId })
          .andWhere('comment.id < :cursor', { cursor })
          .orderBy('comment.createAt', 'DESC')
          .limit(10)
          .getRawMany();

        CommentListOther = await this.commentRepository
          .createQueryBuilder('comment')
          .leftJoin('comment.user', 'user', 'comment.userId = user.userId')
          .leftJoin('user.userImage', 'userImage', 'user.userId=userImage.userId')
          .select([
            'comment.id as commentId',
            'comment.userId as userId',
            'user.nickname as nickname',
            'userImage.imageUrl as imageUrl',
            'comment.content as content',
            'comment.parentId as parentId',
            'comment.createAt as createAt',
          ])
          .where('comment.deleteAt is NULL')
          .andWhere('user.deleteAt is NULL')
          .andWhere('comment.parentId != 0')
          .andWhere('comment.postId = :postId', { postId })
          .orderBy('comment.createAt', 'DESC')
          .getRawMany();
      }
      return { CommentListZero, CommentListOther };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('게시글 총 댓글 불러오기에 실패했습니다.');
      }
    }
  }

  async setComment(userId: number, commentId: number, updateCommentDto: UpdateCommentDto) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }

      const checkComment = await this.commentRepository.findOne({ where: { id: commentId, deleteAt: IsNull() } });
      if (!checkComment) {
        throw new NotFoundException('요청한 댓글의 정보를 찾을 수 없습니다.');
      }

      const { postId, ...dtoWithoutPostId } = updateCommentDto;
      const updatedComment = await this.commentRepository.update(
        { userId: userId, id: commentId, postId: postId },
        dtoWithoutPostId,
      );
      if (updatedComment.affected === 0) {
        // 조건에 맞는 데이터가 없어서 업데이트가 실패한 경우
        throw new UnauthorizedException('댓글 작성자만 수정할 수 있습니다.');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('댓글 수정하기에 실패했습니다.');
      }
    }
  }

  async delComment(userId: number, commentId: number) {
    try {
      const existUser = await this.userRepository.findOne({
        where: { userId, deleteAt: IsNull() },
      });
      if (!existUser) {
        throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
      }

      const checkComment = await this.commentRepository.findOne({ where: { id: commentId, deleteAt: IsNull() } });
      if (!checkComment) {
        throw new NotFoundException('요청한 댓글의 정보를 찾을 수 없습니다.');
      }

      const deletedComment = await this.commentRepository.softDelete({ userId: userId, id: commentId });
      if (deletedComment.affected === 0) {
        // 조건에 맞는 데이터가 없어서 업데이트가 실패한 경우
        throw new UnauthorizedException('게시물 작성자만 삭제할 수 있습니다.');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('댓글 삭제하기를 실패했습니다.');
      }
    }
  }
}
