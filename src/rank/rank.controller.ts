import { Controller, Get, UseGuards } from '@nestjs/common';

import { RankService } from './rank.service';

import { UserId } from 'src/decorators/user-id.decorator';

import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';

@Controller('rank')
export class RankController {
  constructor(private readonly rankService: RankService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/list')
  async findRankList(@UserId() userId: number) {
    const getRank = await this.rankService.getRankList(userId);
    return Object.assign({
      rankList: getRank.rankList,
      statusCode: 200,
      statusMsg: `Top10 랭킹 리스트 불러오기에 성공했습니다.`,
    });
  }
}
