import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RankService } from './rank.service';
import { RankController } from './rank.controller';

import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  exports: [TypeOrmModule],
  controllers: [RankController],
  providers: [RankService],
})
export class RankModule {}
