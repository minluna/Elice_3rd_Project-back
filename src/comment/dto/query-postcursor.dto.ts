import { IsNumberString } from 'class-validator';

export class QueryPostCursorDto {
  @IsNumberString({}, { message: '게시물 ID를 확인해주세요.' })
  postId: number;

  @IsNumberString({}, { message: 'cursor ID를 확인해주세요.' })
  cursor: number;
}
