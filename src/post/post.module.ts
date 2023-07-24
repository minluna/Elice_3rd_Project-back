import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostService } from './post.service';
import { PostController } from './post.controller';
import { User } from '../user/entities/user.entity';
import { Post } from './entities/post.entity';
import { PostImage } from './entities/post-image.entity';

import { MulterModule } from '@nestjs/platform-express';
import { multerOptionsFactory } from 'src/utils/multer.options';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostImage, User]),
    MulterModule.registerAsync({
      imports: [],
      useFactory: multerOptionsFactory,
      inject: [],
    }),
  ],
  exports: [TypeOrmModule],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
