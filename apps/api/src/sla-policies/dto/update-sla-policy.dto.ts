import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateSlaPolicyDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  responseTime?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  resolutionTime?: number;
}
