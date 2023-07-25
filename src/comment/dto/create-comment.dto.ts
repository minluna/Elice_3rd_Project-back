import { IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: '게시물 ID를 확인해주세요.' })
  postId: number;

  @IsNotEmpty({ message: '게시물 내용을 입력하세요.' })
  @MaxLength(200, { message: '게시물 내용은 최대 200글자까지 허용됩니다.' })
  content: string;

  @IsNotEmpty({ message: '게시물 부모 ID를 확인해주세요.' })
  parentId: number;
}
