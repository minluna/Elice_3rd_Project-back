import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Post } from 'src/post/entities/post.entity';
import { User } from 'src/user/entities/user.entity';

@Index('postId', ['postId'], {})
@Index('userId', ['userId'], {})
@Entity('post_like')
export class Like {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: '좋아요의 ID' })
  id: number;

  @Column({ type: 'int', name: 'postId', comment: '좋아요를 누른 게시물의 ID' })
  postId: number;

  @Column({ type: 'int', name: 'userId', comment: '좋아요를 누른 유저의 ID' })
  userId: number;

  @ManyToOne(() => User, (user) => user.Like, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'userId' }])
  user: User;

  @ManyToOne(() => Post, (post) => post.Like, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'postId', referencedColumnName: 'id' }])
  post: Post;
}
