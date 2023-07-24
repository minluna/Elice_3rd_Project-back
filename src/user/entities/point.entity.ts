import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'point' })
export class Point {
  @PrimaryGeneratedColumn({ type: 'int', comment: 'point의 ID' })
  pointId: number;

  @Column({ type: 'int', comment: 'point의 유저 ID' })
  userId: number;

  @Column({ type: 'int', comment: '유저의 현재 포인트' })
  currentPoint: number;

  @Column({ type: 'int', comment: '유저의 누적 포인트' })
  accuPoint: number;

  @OneToOne(() => User, (user) => user.point)
  @JoinColumn({ name: 'userId' })
  user: User;
}
