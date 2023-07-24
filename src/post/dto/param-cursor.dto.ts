import { IsNumberString } from 'class-validator';

export class ParamCursorDto {
  @IsNumberString({}, { message: 'cursor ID를 확인해주세요.' })
  cursor: number;
}
