import * as migration_20251221_222238 from './20251221_222238';
import * as migration_20251221_233551 from './20251221_233551';

export const migrations = [
  {
    up: migration_20251221_222238.up,
    down: migration_20251221_222238.down,
    name: '20251221_222238',
  },
  {
    up: migration_20251221_233551.up,
    down: migration_20251221_233551.down,
    name: '20251221_233551'
  },
];
