import * as migration_20251222_001315 from './20251222_001315';

export const migrations = [
  {
    up: migration_20251222_001315.up,
    down: migration_20251222_001315.down,
    name: '20251222_001315'
  },
];
