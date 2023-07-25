import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from 'src/post/entities/post.entity';
import { User } from 'src/user/entities/user.entity';

@Index('postId', ['postId'], {})
@Index('userId', ['userId'], {})
@Entity('comment')
export class Comment {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: '댓글의 ID' })
  id: number;

  @Column({ type: 'int', name: 'userId', comment: '댓글작성자 ID' })
  userId: number;

  @Column({ type: 'int', name: 'postId', comment: '댓글이 달릴 게시물의 ID' })
  postId: number;

  @Column({ type: 'varchar', name: 'content', comment: '댓글의 내용', length: 200 })
  content: string;

  @CreateDateColumn({ type: 'timestamp', name: 'createAt', comment: '댓글 생성일자' })
  createAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updateAt', comment: '댓글 수정일자' })
  updateAt: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleteAt', nullable: true, comment: '댓글 삭제일자' })
  deleteAt: Date | null;

  @Column({ type: 'int', name: 'parentId', comment: '댓글의 부모', default: () => "'0'" })
  parentId: number;

  @ManyToOne(() => User, (user) => user.comment, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'userId' }])
  user: User;

  @ManyToOne(() => Post, (post) => post.comment, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'postId', referencedColumnName: 'id' }])
  post: Post;
}
