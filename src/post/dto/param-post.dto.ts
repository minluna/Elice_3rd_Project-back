import { IsNumberString } from 'class-validator';

export class ParamPostDto {
  @IsNumberString({}, { message: '게시물의 ID를 확인해주세요.' })
  postId: number;
}
