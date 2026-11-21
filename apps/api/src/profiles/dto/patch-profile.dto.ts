import { IsOptional, IsString, Matches } from 'class-validator';

export class PatchProfileDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9_-]{1,32}$/i)
  username?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  resume?: string;

  /** Maps to now_md in Surreal */
  @IsOptional()
  @IsString()
  now?: string;
}
