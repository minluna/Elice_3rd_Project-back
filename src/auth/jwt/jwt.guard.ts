import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    if (err || !user) {
      console.log(err);
      throw new UnauthorizedException('잘못된 또는 만료된 토큰입니다.');
    }
    return user;
  }
}
