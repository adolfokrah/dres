import * as migration_20251222_001315 from './20251222_001315';
import * as migration_20251222_090821 from './20251222_090821';

export const migrations = [
  {
    up: migration_20251222_001315.up,
    down: migration_20251222_001315.down,
    name: '20251222_001315',
  },
  {
    up: migration_20251222_090821.up,
    down: migration_20251222_090821.down,
    name: '20251222_090821'
  },
];
