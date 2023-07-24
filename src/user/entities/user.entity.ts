import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Point } from './point.entity';
import { UserImage } from './user-image.entity';
import { Post } from 'src/post/entities/post.entity';
// import { Comment } from './Comment';
// import { PostLike } from './PostLike';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar' })
  nickname: string;

  @Column({ type: 'varchar', default: '' })
  description: string;

  @CreateDateColumn({ type: 'timestamp' })
  createAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updateAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleteAt: Date;

  @OneToOne(() => Point, (point) => point.user)
  point: Point;

  @OneToOne(() => UserImage, (userImage) => userImage.user)
  userImage: UserImage;

  // @OneToMany(() => Comment, (comment) => comment.userId)
  // comments: Comment[];

  @OneToMany(() => Post, (post) => post.user)
  post: Post;

  // @OneToMany(() => PostLike, (postLike) => postLike.userId)
  // postLikes: PostLike[];
}
