import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsNotEmpty({ message: '설명을 입력하세요.' })
  description: string;

  @IsOptional()
  @IsNotEmpty({ message: '이미지 파일은 필수 입력 사항입니다.' })
  imageUrl?: any;
}
