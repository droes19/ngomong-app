import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import {
  CapacitorSQLite,
  capTask,
  SQLiteConnection,
  SQLiteDBConnection
} from '@capacitor-community/sqlite';
import Dexie from 'dexie';
import { DATABASE_CONFIG } from '../database.config';
import { validateMigrations } from '../migration-helper';
import { ALL_MIGRATIONS, prepareMigrations } from '../migrations';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Directory, Filesystem } from '@capacitor/filesystem';

// In development mode, validate migrations on service initialization
// This helps catch migration versioning errors early
const isDevelopment = !environment.production;

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | Dexie | null = null;
  private isNative = false;
  private dexieDb: any = null;
  private _isReady = new BehaviorSubject<boolean>(false);

  // Observable to track database readiness
  public isReady$ = this._isReady.asObservable();

  constructor(private platform: Platform) { }

  /**
   * Initialize the database
   */
  async initializeDatabase(): Promise<void> {
    // In development, validate migrations before initialization
    if (isDevelopment) {
      const validation = validateMigrations();
      if (!validation.valid) {
        console.warn('⚠️ MIGRATION VALIDATION FAILED ⚠️');
        validation.errors.forEach(error => console.error(`- ${error}`));

        // Continue anyway in development, but log warnings
        console.warn('Database initialization will continue, but migrations may fail');
      }
    }

    await this.platform.ready();
    console.log("android ", this.platform.is('android'))
    console.log("capacitor ", this.platform.is('capacitor'))
    console.log("cordova ", this.platform.is('cordova'))
    console.log("ios ", this.platform.is('ios'))
    console.log("cordova ", this.platform.is('cordova'))
    console.log("ipad ", this.platform.is('ipad'))
    console.log("iphone ", this.platform.is('iphone'))
    console.log("phablet ", this.platform.is('phablet'))
    console.log("tablet ", this.platform.is('tablet'))
    console.log("electron ", this.platform.is('electron'))
    console.log("pwa ", this.platform.is('pwa'))
    console.log("mobile ", this.platform.is('mobile'))
    console.log("mobileweb ", this.platform.is('mobileweb'))
    console.log("desktop ", this.platform.is('desktop'))
    console.log("hybrid ", this.platform.is('hybrid'))

    //this.isNative = this.platform.is('ios') || this.platform.is('android');
    this.isNative = this.platform.is('hybrid');

    if (this.isNative) {
      await this.initNativeDatabase();

      // Run migrations including table creation
      await this.runMigrations();
    } else {
      await this.initWebDatabase();
    }

    // Mark database as ready
    this._isReady.next(true);
  }

  /**
   * Initialize SQLite database for native platforms
   */
  private async initNativeDatabase(): Promise<void> {
    try {
      console.log('Initializing native SQLite database...');
      this.sqlite = new SQLiteConnection(CapacitorSQLite);

      // Add extra consistency check with retry logic
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          console.log(`Checking SQLite connection consistency (attempt ${retryCount + 1})...`);
          const ret = await this.sqlite.checkConnectionsConsistency();
          const isConn = await this.sqlite.isConnection(DATABASE_CONFIG.name, false);

          if (ret.result && isConn.result) {
            console.log('Existing connection found, retrieving...');
            this.db = await this.sqlite.retrieveConnection(DATABASE_CONFIG.name, false);
            break;
          } else {
            console.log('No existing connection, creating new connection...');
            this.db = await this.sqlite.createConnection(
              DATABASE_CONFIG.name,
              false,
              DATABASE_CONFIG.mode,
              ALL_MIGRATIONS.length > 0 ? Math.max(...ALL_MIGRATIONS.map(m => m.version)) : 1,
              false
            );
            break;
          }
        } catch (error) {
          console.error(`Connection attempt ${retryCount + 1} failed:`, error);
          retryCount++;

          if (retryCount >= maxRetries) {
            let msg = error
            throw new Error(`Failed to connect to SQLite after ${maxRetries} attempts: ${msg}`);
          }

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (!this.db) {
        throw new Error('Failed to initialize database connection');
      }
      await this.db.delete()

      console.log('Opening database connection...');
      await this.db.open();
      // Enable foreign keys
      const result = await (this.db as SQLiteDBConnection).execute('PRAGMA foreign_keys = ON;');
      console.log('Foreign keys enabled:', result);

      console.log('Database URL:', (this.db as SQLiteDBConnection).getUrl());
      // Create migrations table first
      await this.createMigrationsTable();

      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Error initializing native database:', error);
      throw error;
    }
  }

  /**
   * Initialize Dexie database for web platforms
   */
  private async initWebDatabase(): Promise<void> {
    try {
      // Import the generated AppDatabase class
      const { AppDatabase } = await import('../dexie-schema');

      // Create a new instance with the configuration name
      this.dexieDb = new AppDatabase(DATABASE_CONFIG.name);
      this.db = this.dexieDb;
      console.log('Dexie database initialized using generated schema');
    } catch (error) {
      console.error('Error initializing web database:', error);
      throw error;
    }
  }

  /**
   * Create migrations table for tracking database changes
   */
  private async createMigrationsTable(): Promise<void> {
    if (!this.db || !this.isNative) return;

    try {
      // Create migrations table first
      await (this.db as SQLiteDBConnection).execute(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version INTEGER UNIQUE NOT NULL,
          description TEXT,
          executed_at TEXT NOT NULL
        )
      `);
    } catch (error) {
      console.error('Error creating migrations table:', error);
      throw error;
    }
  }

  /**
   * Run database migrations for SQLite (including table creation)
   */
  private async runMigrations(): Promise<void> {
    if (!this.isNative || !this.db) return;
    try {
      // Get current database version
      const versionResult = await (this.db as SQLiteDBConnection).query(
        `SELECT MAX(version) as version FROM migrations`
      );
      const currentVersion = versionResult.values && versionResult.values.length > 0 && versionResult.values[0].version
        ? versionResult.values[0].version
        : 0; // Default to version 0 if no migrations have been run
      console.log(`Current database version: ${currentVersion}`);

      // Get all migrations that should be run
      const pendingMigrations = ALL_MIGRATIONS
        .filter(migration => migration.version > currentVersion)
        .sort((a, b) => a.version - b.version);

      if (pendingMigrations.length === 0) {
        console.log('No pending migrations');
        return;
      }
      console.log(`Running ${pendingMigrations.length} migrations...`);

      // Get prepared statements for Capacitor SQLite
      const upgradeStatements = prepareMigrations();

      // Filter the upgrade statements to only include pending migrations
      const pendingUpgrades = upgradeStatements.filter(
        upgrade => upgrade.toVersion > currentVersion
      );

      // Add all upgrade statements at once
      if (pendingUpgrades.length > 0) {
        console.log(`Adding ${pendingUpgrades.length} upgrade statements...`);
        await this.sqlite!.addUpgradeStatement(DATABASE_CONFIG.name, pendingUpgrades);
      }

      // Run each migration in order to record them in the migrations table
      for (const migration of pendingMigrations) {
        console.log(`Recording migration to version ${migration.version}: ${migration.description}`);

        try {
          // Add migration record
          const recordStatement = {
            statement: `INSERT INTO migrations (version, description, executed_at) VALUES (?, ?, ?)`,
            values: [migration.version, migration.description, new Date().toISOString()]
          } as capTask;

          await (this.db as SQLiteDBConnection).run(recordStatement.statement, recordStatement.values);
          console.log(`Migration to version ${migration.version} completed`);
        } catch (error) {
          console.error(`Recording migration to version ${migration.version} failed:`, error);
          throw error;
        }
      }
      console.log(`Database migrated to version ${Math.max(...pendingMigrations.map(m => m.version))}`);
    } catch (error) {
      console.error('Error running migrations:', error);
      throw error;
    }
  }

  /**
   * Execute a raw query on SQLite (only for native platforms)
   */
  async executeQuery(query: string, params: any[] = []): Promise<any> {
    console.log(this.isNativeDatabase())
    if (!this.isNative || !this.db) {
      throw new Error('SQLite not available on this platform or database not initialized');
    }

    try {
      return await (this.db as SQLiteDBConnection).query(query, params);
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  /**
   * Execute a raw non-query command (INSERT, UPDATE, DELETE) on SQLite
   * Returns changes count
   */
  async executeCommand(query: string, params: any[] = []): Promise<any> {
    if (!this.isNative || !this.db) {
      throw new Error('SQLite not available on this platform or database not initialized');
    }

    try {
      return await (this.db as SQLiteDBConnection).run(query, params);
    } catch (error) {
      console.error('Error executing command:', error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  async closeDatabase(): Promise<void> {
    if (this.isNative && this.sqlite && this.db) {
      await (this.db as SQLiteDBConnection).close();
      await this.sqlite.closeConnection(DATABASE_CONFIG.name, false);
    }
    // Dexie connections are automatically closed
    this._isReady.next(false);
  }

  /**
   * Get the database instance
   * Use this when you need direct access to the database
   */
  getDatabaseInstance(): SQLiteDBConnection | Dexie | null {
    return this.db;
  }

  /**
   * Check if using native database
   */
  isNativeDatabase(): boolean {
    return this.isNative;
  }

  /**
   * Get Dexie instance (web only)
   */
  getDexieInstance(): any {
    if (!this.isNative && this.dexieDb) {
      return this.dexieDb;
    }
    return null;
  }

  async development() {
    if (isDevelopment) {
      let dbDevExists = await Filesystem.readdir({ path: 'databases', directory: Directory.Documents })
      if (dbDevExists.files.length > 0) {
        const files = await Filesystem.readdir({ path: 'databases', directory: Directory.Documents })
        for (const file of files.files) {
          await Filesystem.deleteFile({ path: `databases/${file.name}`, directory: Directory.Documents })
        }
      }

      let db = await Filesystem.readdir({ path: '../databases', directory: Directory.Data })
      for (let d of db.files) {
        await Filesystem.copy({ from: `../databases/${d.name}`, to: `databases/${d.name}`, directory: Directory.Data, toDirectory: Directory.Documents })
      }
    }
  }
}
