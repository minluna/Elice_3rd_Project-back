import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_image' })
export class UserImage {
  @PrimaryGeneratedColumn({ type: 'int', comment: '이미지의 ID' })
  imageId: number;

  @Column({ type: 'int', comment: '이미지의 유저 ID' })
  userId: number;

  @Column({ type: 'varchar', comment: '유저의 이미지' })
  imageUrl: string;

  @OneToOne(() => User, (user) => user.userImage)
  @JoinColumn({ name: 'userId' })
  user: User;
}
