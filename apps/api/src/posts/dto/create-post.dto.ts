import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  brief_description?: string;

  @IsOptional()
  @IsString()
  arc_id?: string;

  @IsOptional()
  @IsString()
  parent_id?: string;

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
  @IsArray()
  interests?: string[];

  @IsOptional()
  post_writer?: unknown;
}
