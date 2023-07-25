import { IsNumberString } from 'class-validator';

export class ParamCommentDto {
  @IsNumberString({}, { message: 'comment ID를 확인해주세요.' })
  commentId: number;
}
