import * as migration_20251221_233551 from './20251221_233551';
import * as migration_20251221_235557 from './20251221_235557';

export const migrations = [
  {
    up: migration_20251221_233551.up,
    down: migration_20251221_233551.down,
    name: '20251221_233551',
  },
  {
    up: migration_20251221_235557.up,
    down: migration_20251221_235557.down,
    name: '20251221_235557'
  },
];
