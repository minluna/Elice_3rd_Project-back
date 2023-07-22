import { IsNumberString } from 'class-validator';

export class ParamUserDto {
  @IsNumberString({}, { message: '유저의 ID를 확인해주세요.' })
  userId: number;
}
