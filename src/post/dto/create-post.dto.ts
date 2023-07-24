import { IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: '게시물 내용을 입력하세요.' })
  @MaxLength(200, { message: '게시물 내용은 최대 200글자까지 허용됩니다.' })
  content: string;

  @IsOptional()
  @IsNotEmpty({ message: '이미지 파일은 필수 입력 사항입니다.' })
  imageUrl?: any;
}
