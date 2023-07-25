import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LikeService } from './like.service';
import { LikeController } from './like.controller';

import { Like } from './entities/like.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Like, User])],
  exports: [TypeOrmModule],
  controllers: [LikeController],
  providers: [LikeService],
})
export class LikeModule {}
