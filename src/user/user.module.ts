import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { UserImage } from './entities/user-image.entity';
import { Point } from './entities/point.entity';

import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/jwt/jwt.strategy';

import { MulterModule } from '@nestjs/platform-express';
import { multerOptionsFactory } from 'src/utils/multer.options';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserImage, Point]),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '1y' },
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MulterModule.registerAsync({
      imports: [],
      useFactory: multerOptionsFactory,
      inject: [],
    }),
  ],
  exports: [TypeOrmModule],
  controllers: [UserController],
  providers: [UserService, JwtStrategy],
})
export class UserModule {}
