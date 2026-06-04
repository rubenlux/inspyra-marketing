import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@inspyra.io' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MyS3cur3Pass!' })
  @IsString()
  @MinLength(8)
  password: string;
}
