import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: '이메일을 입력하세요.' })
  @IsEmail({}, { message: '유효한 이메일을 입력하세요.' })
  email: string;

  @IsNotEmpty({ message: '비밀번호를 입력하세요.' })
  @MinLength(10, { message: '비밀번호는 최소 10자리 이상이어야 합니다.' })
  password: string;

  @IsNotEmpty({ message: '이름을 입력하세요.' })
  nickname: string;

  @IsNotEmpty({ message: 'imageUrl을 확인하세요.' })
  imageUrl: string;
}
