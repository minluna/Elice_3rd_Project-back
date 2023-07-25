import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { PostImage } from './post-image.entity';
import { Comment } from 'src/comment/entities/comment.entity';
import { Like } from 'src/like/entities/like.entity';

@Index('idx_content', ['content'], { fulltext: true })
@Index('userId', ['userId'], {})
@Entity('post')
export class Post {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: '게시물의 ID' })
  id: number;

  @Column('int', { name: 'userId', comment: '게시물 작성자 ID' })
  userId: number;

  @Column('varchar', { name: 'content', comment: '게시물의 내용', length: 200 })
  content: string;

  @Column('int', {
    name: 'isPrivate',
    comment: '게시물 공개여부(0: 공개, 1: 비공개)',
    default: () => "'0'",
  })
  isPrivate: number;

  @CreateDateColumn({ type: 'timestamp', name: 'createAt', comment: '게시물 생성일자' })
  createAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updateAt', comment: '게시물 수정일자' })
  updateAt: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleteAt', nullable: true, comment: '게시물 삭제일자' })
  deleteAt: Date | null;

  @OneToMany(() => Comment, (comment) => comment.post)
  comment: Comment;

  @ManyToOne(() => User, (user) => user.post, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'userId' }])
  user: User;

  @OneToMany(() => PostImage, (postImage) => postImage.post)
  postImage: PostImage;

  @OneToMany(() => Like, (like) => like.post)
  Like: Like;
}
