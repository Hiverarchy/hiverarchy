import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRefutationDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsString()
  parent_id?: string;
}
