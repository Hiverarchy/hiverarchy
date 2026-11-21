import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Surreal } from 'surrealdb';

@Injectable()
export class SurrealService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SurrealService.name);
  readonly db = new Surreal();

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.getOrThrow<string>('surreal.url');
    const user = this.config.getOrThrow<string>('surreal.user');
    const pass = this.config.getOrThrow<string>('surreal.pass');
    const ns = this.config.getOrThrow<string>('surreal.ns');
    const dbName = this.config.getOrThrow<string>('surreal.db');

    await this.db.connect(url);
    await this.db.signin({ username: user, password: pass });
    await this.ensureNamespaceAndDatabase(ns, dbName);
    await this.db.use({ namespace: ns, database: dbName });
    await this.ensureSchema();
    this.logger.log(`Surreal connected (${ns}/${dbName})`);
  }

  /** Create namespace + database if missing (root session). Identifiers come from config only. */
  private async ensureNamespaceAndDatabase(
    ns: string,
    dbName: string,
  ): Promise<void> {
    if (!/^[\w]+$/.test(ns) || !/^[\w]+$/.test(dbName)) {
      throw new Error(
        'SURREAL_NS and SURREAL_DB must be alphanumeric/underscore',
      );
    }
    await this.db.query(
      `DEFINE NAMESPACE IF NOT EXISTS ${ns};
       USE NS ${ns};
       DEFINE DATABASE IF NOT EXISTS ${dbName};`,
    );
  }

  /** Minimal schema for auth + parity work; extend in migrations later. */
  private async ensureSchema(): Promise<void> {
    await this.db.query(`
      DEFINE TABLE IF NOT EXISTS users SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD IF NOT EXISTS email ON users TYPE string ASSERT $value != NONE;
      DEFINE FIELD IF NOT EXISTS password_hash ON users TYPE string ASSERT $value != NONE;
      DEFINE FIELD IF NOT EXISTS created_at ON users TYPE option<datetime> DEFAULT time::now();
      DEFINE INDEX IF NOT EXISTS idx_users_email ON users FIELDS email UNIQUE;

      DEFINE TABLE IF NOT EXISTS profiles SCHEMAFULL PERMISSIONS FULL;
      DEFINE FIELD IF NOT EXISTS user_id ON profiles TYPE string ASSERT $value != NONE;
      DEFINE FIELD IF NOT EXISTS email ON profiles TYPE string;
      DEFINE FIELD IF NOT EXISTS username ON profiles TYPE string ASSERT $value != NONE;
      DEFINE FIELD IF NOT EXISTS tagline ON profiles TYPE option<string>;
      DEFINE FIELD IF NOT EXISTS logo ON profiles TYPE option<string>;
      DEFINE FIELD IF NOT EXISTS resume ON profiles TYPE option<string>;
      DEFINE FIELD IF NOT EXISTS now_md ON profiles TYPE option<string>;
      DEFINE FIELD IF NOT EXISTS created_at ON profiles TYPE option<datetime> DEFAULT time::now();
      DEFINE FIELD IF NOT EXISTS updated_at ON profiles TYPE option<datetime> DEFAULT time::now();
      DEFINE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles FIELDS user_id UNIQUE;
      DEFINE INDEX IF NOT EXISTS idx_profiles_username ON profiles FIELDS username UNIQUE;

      DEFINE TABLE IF NOT EXISTS interests SCHEMALESS PERMISSIONS FULL;
      DEFINE TABLE IF NOT EXISTS posts SCHEMALESS PERMISSIONS FULL;
      DEFINE TABLE IF NOT EXISTS comments SCHEMALESS PERMISSIONS FULL;
      DEFINE TABLE IF NOT EXISTS refutations SCHEMALESS PERMISSIONS FULL;
      DEFINE TABLE IF NOT EXISTS tags SCHEMALESS PERMISSIONS FULL;
      DEFINE TABLE IF NOT EXISTS images SCHEMALESS PERMISSIONS FULL;
    `);
  }

  async onModuleDestroy(): Promise<void> {
    await this.db.close();
  }

  /** Ping database (for health checks). */
  async version(): Promise<string> {
    const v = await this.db.version();
    return v.version;
  }
}
