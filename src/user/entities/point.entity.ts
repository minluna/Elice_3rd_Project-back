import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'point' })
export class Point {
  @PrimaryGeneratedColumn({ type: 'int' })
  pointId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  currentPoint: number;

  @Column({ type: 'int' })
  accuPoint: number;

  @OneToOne(() => User, (user) => user.point)
  @JoinColumn({ name: 'userId' })
  user: User;
}
