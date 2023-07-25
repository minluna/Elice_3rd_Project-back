import { IsNumberString, IsString } from 'class-validator';

export class QueryKeywordCursorDto {
  @IsString({ message: '검색값을 확인해주세요.' })
  keyword: string;

  @IsNumberString({}, { message: 'cursor ID를 확인해주세요.' })
  cursor: number;
}
