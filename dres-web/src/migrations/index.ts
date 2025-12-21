import * as migration_20251221_142959 from './20251221_142959';
import * as migration_20251221_152215 from './20251221_152215';

export const migrations = [
  {
    up: migration_20251221_142959.up,
    down: migration_20251221_142959.down,
    name: '20251221_142959',
  },
  {
    up: migration_20251221_152215.up,
    down: migration_20251221_152215.down,
    name: '20251221_152215'
  },
];
