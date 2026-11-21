import { IsArray, IsOptional, IsString } from 'class-validator';

export class PatchPostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  brief_description?: string;

  @IsOptional()
  @IsArray()
  interest_ids?: string[];

  @IsOptional()
  @IsArray()
  interest_names?: string[];

  @IsOptional()
  @IsArray()
  tag_ids?: string[];

  @IsOptional()
  @IsArray()
  tag_names?: string[];

  @IsOptional()
  post_writer?: unknown;
}
