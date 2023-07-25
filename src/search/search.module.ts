import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SearchService } from './search.service';
import { SearchController } from './search.controller';

import { User } from '../user/entities/user.entity';
import { Post } from '../post/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Post])],
  exports: [TypeOrmModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
