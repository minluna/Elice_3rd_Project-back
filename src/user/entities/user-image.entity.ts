import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_image' })
export class UserImage {
  @PrimaryGeneratedColumn({ type: 'int' })
  imageId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar' })
  imageUrl: string;

  @OneToOne(() => User, (user) => user.user_image)
  @JoinColumn({ name: 'userId' })
  user: User;
}
