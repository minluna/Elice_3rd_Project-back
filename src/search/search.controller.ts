import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { SearchService } from './search.service';

import { QueryKeywordCursorDto } from './dto/query-keywordcursor.dto';

import { UserId } from 'src/decorators/user-id.decorator';

import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async findKeywordPost(@UserId() userId: number, @Query() query: QueryKeywordCursorDto) {
    const keywordPost = await this.searchService.getKeywordPost(userId, query.keyword, query.cursor);
    return Object.assign({
      searchPost: keywordPost.searchPost,
      statusCode: 200,
      statusMsg: `키워드를 포함한 게시물 불러오기에 성공했습니다.`,
    });
  }
}
