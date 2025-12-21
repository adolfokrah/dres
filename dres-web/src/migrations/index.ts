import * as migration_20251221_170911 from './20251221_170911';
import * as migration_20251221_174526 from './20251221_174526';
import * as migration_20251221_181839 from './20251221_181839';

export const migrations = [
  {
    up: migration_20251221_170911.up,
    down: migration_20251221_170911.down,
    name: '20251221_170911',
  },
  {
    up: migration_20251221_174526.up,
    down: migration_20251221_174526.down,
    name: '20251221_174526',
  },
  {
    up: migration_20251221_181839.up,
    down: migration_20251221_181839.down,
    name: '20251221_181839'
  },
];
