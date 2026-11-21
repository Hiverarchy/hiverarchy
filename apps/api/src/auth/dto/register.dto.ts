import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  /** URL-safe handle; if omitted, derived from email local part. */
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9_-]{1,32}$/i)
  username?: string;
}
