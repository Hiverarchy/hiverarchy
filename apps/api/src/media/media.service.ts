import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()
export class MediaService implements OnModuleInit {
  readonly uploadRoot: string;
  readonly publicPath: string;

  constructor(private readonly config: ConfigService) {
    this.uploadRoot = this.config.get<string>('media.uploadRoot') ?? 'uploads';
    this.publicPath = this.config.get<string>('media.publicPath') ?? '/media';
  }

  async onModuleInit(): Promise<void> {
    await mkdir(join(process.cwd(), this.uploadRoot), { recursive: true });
  }

  urlForFilename(filename: string): string {
    const base = this.publicPath.replace(/\/$/, '');
    return `${base}/${filename}`;
  }
}
