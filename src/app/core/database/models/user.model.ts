import { BaseModel, BaseTable, Migration, generateTableSchema, generateAddColumnStatement } from './base.model';

export interface User extends BaseModel {
  username: string;
  email: string;
  usercode: string;
  avatarUrl?: string;
  bio?: string;
  phoneNumber?: string;
}

export interface UserTable extends BaseTable {
  username: string;
  email: string;
  usercode: string;
  avatar_url?: string;
  bio?: string;
  phone_number?: string; // New field example
}

// Migration history for the user table (including initial table creation)
export const USER_MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Create user table',
    queries: [
      generateTableSchema('user', [
        'username TEXT UNIQUE NOT NULL',
        'email TEXT UNIQUE NOT NULL',
        'usercode TEXT UNIQUE NOT NULL',
        'avatar_url TEXT',
        'bio TEXT',
      ])
    ]
  },
  {
    version: 2,
    description: 'Add phone_number to user table',
    queries: [
      generateAddColumnStatement('user', 'phone_number TEXT')
    ]
  },
  // Add future migrations here as needed
];
