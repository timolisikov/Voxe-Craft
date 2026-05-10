import './styles.css';

import * as THREE from 'three';

declare global {
  interface Window {
    __VOXEL_ASSETS__?: Record<string, string>;
  }
}

export type BlockId =
  | 'grass'
  | 'dirt'
  | 'sand'
  | 'stone'
  | 'log'
  | 'leaves'
  | 'planks'
  | 'water'
  | OreBlockId;

type OreBlockId = 'coal_ore' | 'copper_ore' | 'iron_ore' | 'gold_ore' | 'emerald_ore';
type PlaceableBlockId = Exclude<BlockId, OreBlockId>;
type MutableBlockId = Exclude<PlaceableBlockId, 'water'>;
type ToolId = 'flashlight';
type HotbarItemId = PlaceableBlockId | ToolId;
type InputMode = 'computer' | 'mobile';

type BlockRegistryEntry = {
  id: BlockId;
  name: string;
  solid: boolean;
  transparent: boolean;
  hotbarSlot?: number;
  breakTimeMs: number;
  material?: THREE.Material;
};

type HotbarItem = {
  id: HotbarItemId;
  name: string;
  slot: number;
  swatch: string;
  kind: 'block' | 'tool';
};

type BlockPosition = {
  x: number;
  y: number;
  z: number;
};

type RaycastHit = {
  position: BlockPosition;
  normal: THREE.Vector3;
  block: BlockId;
};

type GeometryBucket = {
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
};

type TextureSet = {
  map: THREE.Texture;
};

type VillageSite = {
  x: number;
  y: number;
  z: number;
  radius: number;
};

type MountainFeature = {
  x: number;
  z: number;
  radius: number;
  height: number;
};

type VillagerNpc = {
  root: THREE.Group;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  home: VillageSite;
  axis: 'x' | 'z';
  laneOffset: number;
  routeOffset: number;
  direction: number;
  speed: number;
  phase: number;
};

type CaveMonster = {
  group: THREE.Group;
  head: THREE.Group;
  jawPetals: THREE.Mesh[];
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  light: THREE.PointLight;
};

type MonsterAiState = 'stalking' | 'attacking';

const CHUNK_SIZE = 16;
const WORLD_MIN = -192;
const WORLD_MAX = 191;
const WORLD_WIDTH = WORLD_MAX - WORLD_MIN + 1;
const WORLD_HEIGHT = 64;
const WATER_LEVEL = 13;
const TEXTURE_SEED = 73291;
const SPAWN_X = 3;
const SPAWN_Z = 17;
const PLAYER_EYE_HEIGHT = 1.68;
const PLAYER_HEAD_CLEARANCE = 0.18;
const PLAYER_RADIUS = 0.35;
const COLLISION_EPSILON = 0.001;
const PLAYER_ESCAPE_TEST_DISTANCE = 0.18;
const PLAYER_MOVE_SPEED = 7.4;
const PLAYER_SNEAK_SPEED_MULTIPLIER = 0.45;
const PLAYER_GROUND_ACCELERATION = 42;
const PLAYER_AIR_ACCELERATION = 16;
const PLAYER_WATER_ACCELERATION = 22;
const PLAYER_GROUND_FRICTION = 28;
const PLAYER_AIR_FRICTION = 6;
const PLAYER_WATER_FRICTION = 12;
const PLAYER_SWIM_SPEED = 4.6;
const PLAYER_SWIM_UP_SPEED = 4.3;
const PLAYER_WATER_SINK_SPEED = -1.05;
const PLAYER_WATER_VERTICAL_ACCELERATION = 18;
const COMPUTER_LOOK_SENSITIVITY = 0.0022;
const MOBILE_LOOK_SENSITIVITY = 0.006;
const MONSTER_EMERALD_INTERVAL = 10;
const MONSTER_CAVE_THRESHOLD = 0.32;
const MONSTER_CATCH_DISTANCE = 1.35;
const MONSTER_STALK_DISTANCE = 36;
const MONSTER_STALK_SIDE_DISTANCE = 13;
const MONSTER_SPAWN_DISTANCE = 52;
const MONSTER_STALK_SPEED = 2.35;
const MONSTER_RETREAT_SPEED = 4.2;
const MONSTER_ATTACK_SPEED = 7.2;
const MONSTER_MIN_STALK_SECONDS = 9;
const JUMPSCARE_SECONDS = 5;
const UP = new THREE.Vector3(0, 1, 0);
const FLASHLIGHT_ITEM_ID: ToolId = 'flashlight';

const placeableBlockIds: PlaceableBlockId[] = [
  'grass',
  'dirt',
  'sand',
  'stone',
  'log',
  'leaves',
  'planks',
  'water'
];

const oreBlockIds: OreBlockId[] = ['coal_ore', 'copper_ore', 'iron_ore', 'gold_ore', 'emerald_ore'];
const oreBlockSet = new Set<BlockId>(oreBlockIds);
const blockIds: BlockId[] = [...placeableBlockIds, ...oreBlockIds];
const materialBlockIds: BlockId[] = [...blockIds];

export const blockRegistry: Record<BlockId, BlockRegistryEntry> = {
  grass: {
    id: 'grass',
    name: 'Grass',
    solid: true,
    transparent: false,
    hotbarSlot: 1,
    breakTimeMs: 260
  },
  dirt: {
    id: 'dirt',
    name: 'Dirt',
    solid: true,
    transparent: false,
    hotbarSlot: 2,
    breakTimeMs: 240
  },
  sand: {
    id: 'sand',
    name: 'Sand',
    solid: true,
    transparent: false,
    hotbarSlot: 3,
    breakTimeMs: 230
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    solid: true,
    transparent: false,
    hotbarSlot: 4,
    breakTimeMs: 420
  },
  log: {
    id: 'log',
    name: 'Log',
    solid: true,
    transparent: false,
    hotbarSlot: 5,
    breakTimeMs: 360
  },
  leaves: {
    id: 'leaves',
    name: 'Leaves',
    solid: true,
    transparent: false,
    hotbarSlot: 6,
    breakTimeMs: 160
  },
  planks: {
    id: 'planks',
    name: 'Planks',
    solid: true,
    transparent: false,
    hotbarSlot: 7,
    breakTimeMs: 300
  },
  water: {
    id: 'water',
    name: 'Water',
    solid: false,
    transparent: true,
    hotbarSlot: 8,
    breakTimeMs: 120
  },
  coal_ore: {
    id: 'coal_ore',
    name: 'Coal Ore',
    solid: true,
    transparent: false,
    breakTimeMs: 460
  },
  copper_ore: {
    id: 'copper_ore',
    name: 'Copper Ore',
    solid: true,
    transparent: false,
    breakTimeMs: 500
  },
  iron_ore: {
    id: 'iron_ore',
    name: 'Iron Ore',
    solid: true,
    transparent: false,
    breakTimeMs: 540
  },
  gold_ore: {
    id: 'gold_ore',
    name: 'Gold Ore',
    solid: true,
    transparent: false,
    breakTimeMs: 600
  },
  emerald_ore: {
    id: 'emerald_ore',
    name: 'Emerald Ore',
    solid: true,
    transparent: false,
    breakTimeMs: 680
  }
};

const texturePaths: Record<MutableBlockId, string> = {
  grass: 'textures/grass',
  dirt: 'textures/dirt',
  sand: 'textures/sand',
  stone: 'textures/stone',
  log: 'textures/log',
  leaves: 'textures/leaves',
  planks: 'textures/planks'
};

const swatches: Record<BlockId, string> = {
  grass: '#577948',
  dirt: '#72543f',
  sand: '#cdbb80',
  stone: '#89877d',
  log: '#6a4a2e',
  leaves: '#4c7a43',
  planks: '#a47747',
  water: '#4aa8c6',
  coal_ore: '#2f3030',
  copper_ore: '#c87944',
  iron_ore: '#b9a58b',
  gold_ore: '#e4bd47',
  emerald_ore: '#35b56f'
};

const orePixelPalettes: Record<OreBlockId, string[]> = {
  coal_ore: ['#111314', '#202224', '#303333', '#4b4d4c'],
  copper_ore: ['#7f442b', '#ad6340', '#d18a57', '#efb47a'],
  iron_ore: ['#8c7358', '#ad9374', '#ccb08d', '#e0c7a3'],
  gold_ore: ['#9d6c1c', '#c99029', '#ebc343', '#ffe271'],
  emerald_ore: ['#11663d', '#1d9d59', '#35d777', '#91f2b0']
};

const hotbarItems: HotbarItem[] = [
  ...placeableBlockIds.map((blockId) => ({
    id: blockId,
    name: blockRegistry[blockId].name,
    slot: blockRegistry[blockId].hotbarSlot ?? 0,
    swatch: swatches[blockId],
    kind: 'block' as const
  })),
  {
    id: FLASHLIGHT_ITEM_ID,
    name: 'Taschenlampe',
    slot: 9,
    swatch: '#ffd36a',
    kind: 'tool'
  }
];

function isPlaceableHotbarItem(item: HotbarItemId): item is PlaceableBlockId {
  return item !== FLASHLIGHT_ITEM_ID;
}

const faceDefinitions = [
  {
    dir: [1, 0, 0],
    corners: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1]
    ]
  },
  {
    dir: [-1, 0, 0],
    corners: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0]
    ]
  },
  {
    dir: [0, 1, 0],
    corners: [
      [0, 1, 0],
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0]
    ]
  },
  {
    dir: [0, -1, 0],
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1]
    ]
  },
  {
    dir: [0, 0, 1],
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1]
    ]
  },
  {
    dir: [0, 0, -1],
    corners: [
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0]
    ]
  }
] as const;

const uvTemplate = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1]
] as const;

declare global {
  interface Window {
    voxelDebug?: {
      countBlocks: () => number;
      getBlock: (x: number, y: number, z: number) => BlockId | null;
      placeBlock: (x: number, y: number, z: number, block: BlockId) => boolean;
      removeBlock: (x: number, y: number, z: number) => BlockId | null;
      resetWorld: () => void;
      spawn: () => { x: number; y: number; z: number };
      seed: () => number;
      worldSize: () => { min: number; max: number; width: number };
    };
  }
}

class VoxelWorld {
  private readonly scene: THREE.Scene;
  private readonly materials: Record<BlockId, THREE.Material>;
  private readonly blocks = new Map<number, BlockId>();
  private readonly chunks = new Map<string, THREE.Group>();
  private readonly dirtyChunks = new Set<string>();
  private villageSites: VillageSite[] = [];
  private mountainFeatures: MountainFeature[] = [];
  private seed = createWorldSeed();

  constructor(scene: THREE.Scene, materials: Record<BlockId, THREE.Material>) {
    this.scene = scene;
    this.materials = materials;
  }

  reset(seed = createWorldSeed()): void {
    this.seed = seed;
    this.mountainFeatures = this.createMountainFeatures();

    for (const chunk of this.chunks.values()) {
      this.disposeChunk(chunk);
      this.scene.remove(chunk);
    }

    this.chunks.clear();
    this.dirtyChunks.clear();
    this.blocks.clear();
    this.villageSites = [];
    this.generateTerrain();
    this.rebuildAllChunks();
  }

  getSeed(): number {
    return this.seed;
  }

  getVillages(): VillageSite[] {
    return this.villageSites.map((village) => ({ ...village }));
  }

  flushChunkUpdates(maxChunks = Number.POSITIVE_INFINITY): void {
    let rebuilt = 0;

    for (const key of this.dirtyChunks) {
      if (rebuilt >= maxChunks) {
        break;
      }

      this.dirtyChunks.delete(key);
      const [cx, cz] = key.split(':').map(Number);
      this.rebuildChunk(cx, cz);
      rebuilt += 1;
    }
  }

  countBlocks(): number {
    return this.blocks.size;
  }

  getBlock(x: number, y: number, z: number): BlockId | null {
    if (!this.isInBounds(x, y, z)) {
      return null;
    }

    return this.blocks.get(this.key(x, y, z)) ?? null;
  }

  placeBlock(position: BlockPosition, block: BlockId): boolean {
    if (!this.isInBounds(position.x, position.y, position.z)) {
      return false;
    }

    if (this.getBlock(position.x, position.y, position.z)) {
      return false;
    }

    this.setBlock(position.x, position.y, position.z, block);
    this.refreshBlockNeighborhood(position.x, position.y, position.z);
    return true;
  }

  removeBlock(position: BlockPosition): BlockId | null {
    if (!this.isInBounds(position.x, position.y, position.z) || position.y <= 0) {
      return null;
    }

    const current = this.getBlock(position.x, position.y, position.z);

    if (!current) {
      return null;
    }

    this.blocks.delete(this.key(position.x, position.y, position.z));
    this.refreshBlockNeighborhood(position.x, position.y, position.z);
    return current;
  }

  raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number): RaycastHit | null {
    const rayDirection = direction.clone().normalize();
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = Math.sign(rayDirection.x);
    const stepY = Math.sign(rayDirection.y);
    const stepZ = Math.sign(rayDirection.z);

    let tMaxX = intBound(origin.x, rayDirection.x);
    let tMaxY = intBound(origin.y, rayDirection.y);
    let tMaxZ = intBound(origin.z, rayDirection.z);

    const tDeltaX = stepX === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / rayDirection.x);
    const tDeltaY = stepY === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / rayDirection.y);
    const tDeltaZ = stepZ === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / rayDirection.z);

    const normal = new THREE.Vector3();
    let travelled = 0;

    for (let i = 0; i < 160 && travelled <= maxDistance; i += 1) {
      const block = this.getBlock(x, y, z);

      if (block) {
        return {
          position: { x, y, z },
          normal: normal.clone(),
          block
        };
      }

      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        x += stepX;
        travelled = tMaxX;
        tMaxX += tDeltaX;
        normal.set(-stepX, 0, 0);
      } else if (tMaxY < tMaxZ) {
        y += stepY;
        travelled = tMaxY;
        tMaxY += tDeltaY;
        normal.set(0, -stepY, 0);
      } else {
        z += stepZ;
        travelled = tMaxZ;
        tMaxZ += tDeltaZ;
        normal.set(0, 0, -stepZ);
      }
    }

    return null;
  }

  getSpawnPosition(): THREE.Vector3 {
    const x = SPAWN_X + 0.5;
    const z = SPAWN_Z + 0.5;
    const y = this.getGroundSurfaceY(x, z) + PLAYER_EYE_HEIGHT + 1.2;
    return new THREE.Vector3(x, y, z);
  }

  getGroundSurfaceY(x: number, z: number): number {
    const blockX = Math.floor(x);
    const blockZ = Math.floor(z);
    let solidSurface = 1;
    let waterSurface = Number.NEGATIVE_INFINITY;

    for (let y = WORLD_HEIGHT - 1; y >= 0; y -= 1) {
      const block = this.getBlock(blockX, y, blockZ);

      if (!block) {
        continue;
      }

      if (block === 'water') {
        waterSurface = Math.max(waterSurface, y + 1);
        continue;
      }

      if (blockRegistry[block].solid) {
        solidSurface = y + 1;
        break;
      }
    }

    return Math.max(solidSurface, waterSurface);
  }

  private generateTerrain(): void {
    const heights = new Map<string, number>();

    for (let x = WORLD_MIN; x <= WORLD_MAX; x += 1) {
      for (let z = WORLD_MIN; z <= WORLD_MAX; z += 1) {
        const height = this.getTerrainHeight(x, z);
        heights.set(this.columnKey(x, z), height);

        for (let y = 0; y <= height; y += 1) {
          this.setBlock(x, y, z, this.getNaturalBlock(x, y, z, height));
        }

        if (height < WATER_LEVEL) {
          for (let y = height + 1; y <= WATER_LEVEL; y += 1) {
            this.setBlock(x, y, z, 'water');
          }
        }
      }
    }

    this.carveCaves(heights);
    this.addOres(heights);
    this.villageSites = this.addVillages(heights);

    for (let x = WORLD_MIN + 3; x <= WORLD_MAX - 3; x += 1) {
      for (let z = WORLD_MIN + 3; z <= WORLD_MAX - 3; z += 1) {
        const height = heights.get(this.columnKey(x, z)) ?? 0;
        const treeRoll = hash2(x * 11, z * 17, this.seed + 21);
        const openLand = height > WATER_LEVEL + 2 && z > -22;
        const awayFromSpawn = Math.hypot(x - SPAWN_X, z - SPAWN_Z) > 14;
        const awayFromVillage = this.villageSites.every((village) => Math.hypot(x - village.x, z - village.z) > village.radius + 5);

        if (openLand && awayFromSpawn && awayFromVillage && treeRoll > 0.982) {
          this.addTree(x, height + 1, z, 4 + Math.floor(hash2(x, z, this.seed + 91) * 3));
        }
      }
    }
  }

  private getNaturalBlock(x: number, y: number, z: number, height: number): BlockId {
    const isBeach = height <= WATER_LEVEL + 2 || z < -12;

    if (y === height) {
      return isBeach ? 'sand' : 'grass';
    }

    if (isBeach && y > height - 4) {
      return 'sand';
    }

    if (y > height - 4) {
      return 'dirt';
    }

    return 'stone';
  }

  private carveCaves(heights: Map<string, number>): void {
    for (let x = WORLD_MIN + 2; x <= WORLD_MAX - 2; x += 1) {
      for (let z = WORLD_MIN + 2; z <= WORLD_MAX - 2; z += 1) {
        const height = heights.get(this.columnKey(x, z)) ?? 0;

        for (let y = 4; y < height - 2; y += 1) {
          if (this.shouldCarveCave(x, y, z, height)) {
            this.blocks.delete(this.key(x, y, z));
          }
        }
      }
    }
  }

  private shouldCarveCave(x: number, y: number, z: number, height: number): boolean {
    const depth = (height - y) / Math.max(height, 1);

    if (depth < 0.12 || Math.hypot(x - SPAWN_X, z - SPAWN_Z) < 10) {
      return false;
    }

    const chamber = fbm3(x * 0.048, y * 0.082, z * 0.048, 3, this.seed + 311);
    const tunnelNoise = fbm3(x * 0.026, y * 0.055, z * 0.026, 2, this.seed + 719);
    const tunnel = Math.abs(Math.sin(x * 0.082 + z * 0.069 + tunnelNoise * 6.2));

    return chamber > 0.58 || (tunnel < 0.32 && chamber > 0.42);
  }

  private addOres(heights: Map<string, number>): void {
    for (let x = WORLD_MIN + 1; x <= WORLD_MAX - 1; x += 1) {
      for (let z = WORLD_MIN + 1; z <= WORLD_MAX - 1; z += 1) {
        const height = heights.get(this.columnKey(x, z)) ?? 0;

        for (let y = 4; y < height - 3; y += 1) {
          if (this.getBlock(x, y, z) !== 'stone' || !this.isExposedToCave(x, y, z)) {
            continue;
          }

          const ore = this.getOreForPosition(x, y, z);

          if (ore) {
            this.setBlock(x, y, z, ore);
          }
        }
      }
    }
  }

  private isExposedToCave(x: number, y: number, z: number): boolean {
    for (const face of faceDefinitions) {
      if (!this.getBlock(x + face.dir[0], y + face.dir[1], z + face.dir[2])) {
        return true;
      }
    }

    return false;
  }

  private getOreForPosition(x: number, y: number, z: number): OreBlockId | null {
    const roll = hash3(x, y, z, this.seed + 911);

    if (y < 18 && roll > 0.992) {
      return 'emerald_ore';
    }

    if (y < 25 && roll > 0.982) {
      return 'gold_ore';
    }

    if (y < 42 && roll > 0.958) {
      return 'iron_ore';
    }

    if (y < 52 && roll > 0.936) {
      return 'copper_ore';
    }

    if (roll > 0.91) {
      return 'coal_ore';
    }

    return null;
  }

  private addVillages(heights: Map<string, number>): VillageSite[] {
    const candidates = this.createVillageCandidates();
    const villages: VillageSite[] = [];

    for (const candidate of candidates) {
      const village = this.addVillage(heights, candidate.x, candidate.z);

      if (village) {
        villages.push(village);
      }
    }

    return villages;
  }

  private createVillageCandidates(): Array<{ x: number; z: number }> {
    const candidates: Array<{ x: number; z: number }> = [];
    const margin = 36;
    const landMinZ = -4;

    for (let i = 0; i < 12; i += 1) {
      const x = Math.round(lerp(WORLD_MIN + margin, WORLD_MAX - margin, hash2(i, 31, this.seed + 2301)));
      const z = Math.round(lerp(landMinZ, WORLD_MAX - margin, hash2(i, 59, this.seed + 2309)));

      if (Math.hypot(x - SPAWN_X, z - SPAWN_Z) > 42) {
        candidates.push({ x, z });
      }
    }

    return candidates;
  }

  private addVillage(heights: Map<string, number>, centerX: number, centerZ: number): VillageSite | null {
    const radius = 19;
    const baseY = this.getVillageBaseHeight(heights, centerX, centerZ, radius);

    if (baseY === null || baseY <= WATER_LEVEL + 2) {
      return null;
    }

    this.levelVillageGround(heights, centerX, centerZ, radius, baseY);
    this.buildVillagePaths(centerX, baseY, centerZ);
    this.buildWell(centerX, baseY, centerZ);
    this.buildHouse(centerX - 14, baseY, centerZ - 11, 7, 6, 'east');
    this.buildHouse(centerX + 8, baseY, centerZ - 10, 7, 6, 'west');
    this.buildHouse(centerX - 13, baseY, centerZ + 8, 8, 7, 'north');
    this.buildHouse(centerX + 8, baseY, centerZ + 8, 7, 7, 'north');

    return { x: centerX, y: baseY, z: centerZ, radius };
  }

  private getVillageBaseHeight(
    heights: Map<string, number>,
    centerX: number,
    centerZ: number,
    radius: number
  ): number | null {
    const samples: number[] = [];

    for (let x = centerX - radius; x <= centerX + radius; x += 4) {
      for (let z = centerZ - radius; z <= centerZ + radius; z += 4) {
        if (!this.isInBounds(x, 1, z) || Math.hypot(x - centerX, z - centerZ) > radius) {
          continue;
        }

        const height = heights.get(this.columnKey(x, z));

        if (height !== undefined && height > WATER_LEVEL + 1) {
          samples.push(height);
        }
      }
    }

    if (samples.length < 18) {
      return null;
    }

    samples.sort((a, b) => a - b);
    return Math.round(samples[Math.floor(samples.length / 2)]);
  }

  private levelVillageGround(
    heights: Map<string, number>,
    centerX: number,
    centerZ: number,
    radius: number,
    baseY: number
  ): void {
    for (let x = centerX - radius; x <= centerX + radius; x += 1) {
      for (let z = centerZ - radius; z <= centerZ + radius; z += 1) {
        const distance = Math.hypot(x - centerX, z - centerZ);

        if (!this.isInBounds(x, baseY, z) || distance > radius) {
          continue;
        }

        const columnY = distance > radius - 4
          ? Math.round(lerp(baseY, heights.get(this.columnKey(x, z)) ?? baseY, (distance - (radius - 4)) / 4))
          : baseY;

        for (let y = 0; y <= columnY; y += 1) {
          this.setBlock(x, y, z, y === columnY ? 'grass' : y > columnY - 4 ? 'dirt' : 'stone');
        }

        for (let y = columnY + 1; y < Math.min(WORLD_HEIGHT, columnY + 9); y += 1) {
          this.blocks.delete(this.key(x, y, z));
        }

        heights.set(this.columnKey(x, z), columnY);
      }
    }
  }

  private buildVillagePaths(centerX: number, y: number, centerZ: number): void {
    this.buildPathRect(centerX - 17, y, centerZ - 1, centerX + 17, centerZ + 1);
    this.buildPathRect(centerX - 1, y, centerZ - 16, centerX + 1, centerZ + 17);
    this.buildPathRect(centerX - 14, y, centerZ - 5, centerX - 8, centerZ - 3);
    this.buildPathRect(centerX + 8, y, centerZ - 5, centerX + 14, centerZ - 3);
    this.buildPathRect(centerX - 12, y, centerZ + 4, centerX - 6, centerZ + 6);
    this.buildPathRect(centerX + 8, y, centerZ + 4, centerX + 14, centerZ + 6);
  }

  private buildPathRect(minX: number, y: number, minZ: number, maxX: number, maxZ: number): void {
    for (let x = minX; x <= maxX; x += 1) {
      for (let z = minZ; z <= maxZ; z += 1) {
        this.setBlock(x, y, z, 'sand');

        for (let clearY = y + 1; clearY <= y + 3; clearY += 1) {
          this.blocks.delete(this.key(x, clearY, z));
        }
      }
    }
  }

  private buildHouse(
    originX: number,
    groundY: number,
    originZ: number,
    width: number,
    depth: number,
    doorSide: 'north' | 'south' | 'east' | 'west'
  ): void {
    const maxX = originX + width - 1;
    const maxZ = originZ + depth - 1;
    const doorX = Math.floor((originX + maxX) / 2);
    const doorZ = Math.floor((originZ + maxZ) / 2);

    this.clearVolume(originX - 1, groundY + 1, originZ - 1, maxX + 1, groundY + 7, maxZ + 1);

    for (let x = originX; x <= maxX; x += 1) {
      for (let z = originZ; z <= maxZ; z += 1) {
        this.setBlock(x, groundY, z, 'planks');
      }
    }

    for (let y = groundY + 1; y <= groundY + 3; y += 1) {
      for (let x = originX; x <= maxX; x += 1) {
        for (let z = originZ; z <= maxZ; z += 1) {
          const isWall = x === originX || x === maxX || z === originZ || z === maxZ;

          if (!isWall || this.isDoorBlock(x, y, z, groundY, doorSide, doorX, doorZ, originX, maxX, originZ, maxZ)) {
            continue;
          }

          const isCorner = (x === originX || x === maxX) && (z === originZ || z === maxZ);
          this.setBlock(x, y, z, isCorner ? 'log' : 'planks');
        }
      }
    }

    for (let x = originX - 1; x <= maxX + 1; x += 1) {
      for (let z = originZ - 1; z <= maxZ + 1; z += 1) {
        this.setBlock(x, groundY + 4, z, 'planks');
      }
    }

    for (let x = originX; x <= maxX; x += 1) {
      for (let z = originZ; z <= maxZ; z += 1) {
        if (x === originX || x === maxX || z === originZ || z === maxZ) {
          this.setBlock(x, groundY + 5, z, 'log');
        }
      }
    }
  }

  private isDoorBlock(
    x: number,
    y: number,
    z: number,
    groundY: number,
    doorSide: 'north' | 'south' | 'east' | 'west',
    doorX: number,
    doorZ: number,
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number
  ): boolean {
    if (y <= groundY + 2) {
      return (
        (doorSide === 'north' && z === minZ && x === doorX) ||
        (doorSide === 'south' && z === maxZ && x === doorX) ||
        (doorSide === 'west' && x === minX && z === doorZ) ||
        (doorSide === 'east' && x === maxX && z === doorZ)
      );
    }

    return false;
  }

  private buildWell(centerX: number, groundY: number, centerZ: number): void {
    this.clearVolume(centerX - 2, groundY + 1, centerZ - 2, centerX + 2, groundY + 5, centerZ + 2);

    for (let x = centerX - 1; x <= centerX + 1; x += 1) {
      for (let z = centerZ - 1; z <= centerZ + 1; z += 1) {
        const isCenter = x === centerX && z === centerZ;
        this.setBlock(x, groundY, z, isCenter ? 'water' : 'stone');
      }
    }

    for (const [x, z] of [
      [centerX - 1, centerZ - 1],
      [centerX + 1, centerZ - 1],
      [centerX - 1, centerZ + 1],
      [centerX + 1, centerZ + 1]
    ]) {
      for (let y = groundY + 1; y <= groundY + 3; y += 1) {
        this.setBlock(x, y, z, 'log');
      }
    }

    for (let x = centerX - 2; x <= centerX + 2; x += 1) {
      for (let z = centerZ - 2; z <= centerZ + 2; z += 1) {
        this.setBlock(x, groundY + 4, z, 'planks');
      }
    }
  }

  private clearVolume(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): void {
    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        for (let z = minZ; z <= maxZ; z += 1) {
          if (this.isInBounds(x, y, z)) {
            this.blocks.delete(this.key(x, y, z));
          }
        }
      }
    }
  }

  private addTree(x: number, y: number, z: number, height: number): void {
    for (let i = 0; i < height; i += 1) {
      this.setBlock(x, y + i, z, 'log');
    }

    const leafCenterY = y + height;

    for (let lx = -2; lx <= 2; lx += 1) {
      for (let ly = -2; ly <= 2; ly += 1) {
        for (let lz = -2; lz <= 2; lz += 1) {
          const distance = Math.abs(lx) + Math.abs(lz) + Math.max(0, Math.abs(ly) - 1);
          const leafX = x + lx;
          const leafY = leafCenterY + ly;
          const leafZ = z + lz;

          if (distance > 4 || !this.isInBounds(leafX, leafY, leafZ)) {
            continue;
          }

          if (!this.getBlock(leafX, leafY, leafZ) || ly > 0) {
            this.setBlock(leafX, leafY, leafZ, 'leaves');
          }
        }
      }
    }
  }

  private getTerrainHeight(x: number, z: number): number {
    const broad = fbm(x * 0.038, z * 0.038, 4, this.seed);
    const detail = fbm(x * 0.11, z * 0.11, 3, this.seed + 99);
    const oceanFactor = smooth01(clamp((-8 - z) / 34, 0, 1));
    const coastBlend = smooth01(clamp((z + 24) / 18, 0, 1)) * smooth01(clamp((-2 - z) / 18, 0, 1));

    let height = 12 + broad * 10 + detail * 3;

    for (const feature of this.mountainFeatures) {
      height += mountain(x, z, feature.x, feature.z, feature.radius, feature.height);
    }

    height -= oceanFactor * 13;
    height = lerp(height, WATER_LEVEL + (detail - 0.5) * 3, coastBlend * 0.55);

    return Math.floor(clamp(height, 3, WORLD_HEIGHT - 9));
  }

  private createMountainFeatures(): MountainFeature[] {
    const features: MountainFeature[] = [];
    const margin = 28;

    for (let i = 0; i < 13; i += 1) {
      const x = Math.round(lerp(WORLD_MIN + margin, WORLD_MAX - margin, hash2(i, 7, this.seed + 1201)));
      const z = Math.round(lerp(WORLD_MIN + margin, WORLD_MAX - margin, hash2(i, 17, this.seed + 1217)));

      if (Math.hypot(x - SPAWN_X, z - SPAWN_Z) < 22) {
        continue;
      }

      features.push({
        x,
        z,
        radius: 16 + Math.round(hash2(i, 29, this.seed + 1231) * 20),
        height: 8 + Math.round(hash2(i, 43, this.seed + 1249) * 16)
      });
    }

    return features;
  }

  private rebuildAllChunks(): void {
    const minChunk = chunkCoord(WORLD_MIN);
    const maxChunk = chunkCoord(WORLD_MAX);

    for (let cx = minChunk; cx <= maxChunk; cx += 1) {
      for (let cz = minChunk; cz <= maxChunk; cz += 1) {
        this.rebuildChunk(cx, cz);
      }
    }
  }

  private refreshBlockNeighborhood(x: number, y: number, z: number): void {
    const affected = new Set<string>();
    const cx = chunkCoord(x);
    const cz = chunkCoord(z);
    const localX = localChunkBlockCoord(x);
    const localZ = localChunkBlockCoord(z);

    affected.add(this.chunkKey(cx, cz));

    if (localX === 0) {
      affected.add(this.chunkKey(cx - 1, cz));
    } else if (localX === CHUNK_SIZE - 1) {
      affected.add(this.chunkKey(cx + 1, cz));
    }

    if (localZ === 0) {
      affected.add(this.chunkKey(cx, cz - 1));
    } else if (localZ === CHUNK_SIZE - 1) {
      affected.add(this.chunkKey(cx, cz + 1));
    }

    for (const key of affected) {
      this.dirtyChunks.add(key);
    }

    void y;
  }

  private rebuildChunk(cx: number, cz: number): void {
    const key = this.chunkKey(cx, cz);
    const existing = this.chunks.get(key);

    if (existing) {
      this.disposeChunk(existing);
      this.scene.remove(existing);
      this.chunks.delete(key);
    }

    const buckets = new Map<BlockId, GeometryBucket>();

    for (const blockId of materialBlockIds) {
      buckets.set(blockId, {
        positions: [],
        normals: [],
        uvs: [],
        indices: []
      });
    }

    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;

    for (let x = startX; x < startX + CHUNK_SIZE; x += 1) {
      if (x < WORLD_MIN || x > WORLD_MAX) {
        continue;
      }

      for (let z = startZ; z < startZ + CHUNK_SIZE; z += 1) {
        if (z < WORLD_MIN || z > WORLD_MAX) {
          continue;
        }

        for (let y = 0; y < WORLD_HEIGHT; y += 1) {
          const block = this.getBlock(x, y, z);

          if (!block) {
            continue;
          }

          for (const face of faceDefinitions) {
            const neighbor = this.getBlock(
              x + face.dir[0],
              y + face.dir[1],
              z + face.dir[2]
            );

            if (this.shouldDrawFace(block, neighbor)) {
              this.addFace(buckets.get(block)!, x, y, z, face);
            }
          }
        }
      }
    }

    const group = new THREE.Group();
    group.name = `chunk:${cx}:${cz}`;

    for (const blockId of materialBlockIds) {
      const bucket = buckets.get(blockId)!;

      if (bucket.positions.length === 0) {
        continue;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(bucket.positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(bucket.normals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(bucket.uvs, 2));
      geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(bucket.uvs, 2));
      geometry.setIndex(bucket.indices);
      geometry.computeBoundingSphere();

      const mesh = new THREE.Mesh(geometry, this.materials[blockId]);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.renderOrder = blockId === 'water' ? 8 : blockId === 'leaves' ? 6 : 0;
      group.add(mesh);
    }

    if (group.children.length > 0) {
      this.chunks.set(key, group);
      this.scene.add(group);
    }
  }

  private addFace(
    bucket: GeometryBucket,
    x: number,
    y: number,
    z: number,
    face: (typeof faceDefinitions)[number]
  ): void {
    const vertexIndex = bucket.positions.length / 3;

    for (let i = 0; i < 4; i += 1) {
      const corner = face.corners[i];
      bucket.positions.push(x + corner[0], y + corner[1], z + corner[2]);
      bucket.normals.push(face.dir[0], face.dir[1], face.dir[2]);
      bucket.uvs.push(uvTemplate[i][0], uvTemplate[i][1]);
    }

    bucket.indices.push(
      vertexIndex,
      vertexIndex + 1,
      vertexIndex + 2,
      vertexIndex,
      vertexIndex + 2,
      vertexIndex + 3
    );
  }

  private shouldDrawFace(block: BlockId, neighbor: BlockId | null): boolean {
    if (!neighbor) {
      return true;
    }

    if (block === 'water') {
      return neighbor !== 'water' && !blockRegistry[neighbor].solid;
    }

    if (blockRegistry[block].transparent) {
      return neighbor !== block;
    }

    return blockRegistry[neighbor].transparent || !blockRegistry[neighbor].solid;
  }

  private setBlock(x: number, y: number, z: number, block: BlockId): void {
    if (this.isInBounds(x, y, z)) {
      this.blocks.set(this.key(x, y, z), block);
    }
  }

  private isInBounds(x: number, y: number, z: number): boolean {
    return x >= WORLD_MIN && x <= WORLD_MAX && z >= WORLD_MIN && z <= WORLD_MAX && y >= 0 && y < WORLD_HEIGHT;
  }

  private key(x: number, y: number, z: number): number {
    return ((x - WORLD_MIN) * WORLD_HEIGHT + y) * WORLD_WIDTH + (z - WORLD_MIN);
  }

  private columnKey(x: number, z: number): string {
    return `${x}:${z}`;
  }

  private chunkKey(cx: number, cz: number): string {
    return `${cx}:${cz}`;
  }

  private disposeChunk(chunk: THREE.Group): void {
    chunk.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
      }
    });
  }
}

function createUi(): {
  loading: HTMLDivElement;
  progressBar: HTMLDivElement;
  loadingStatus: HTMLSpanElement;
  loadingPercent: HTMLSpanElement;
  computerButton: HTMLButtonElement;
  mobileButton: HTMLButtonElement;
  fullscreenButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  hotbar: HTMLDivElement;
  targetChip: HTMLDivElement;
  mobileControls: HTMLDivElement;
  mobileJoystick: HTMLDivElement;
  mobileJoystickKnob: HTMLDivElement;
  mobileJumpButton: HTMLButtonElement;
  mobileCrouchButton: HTMLButtonElement;
  mobileMineButton: HTMLButtonElement;
  mobilePlaceButton: HTMLButtonElement;
  mobileInventoryButton: HTMLButtonElement;
  resumeLayer: HTMLDivElement;
  resumeButton: HTMLButtonElement;
  pauseMenu: HTMLDivElement;
  pauseResumeButton: HTMLButtonElement;
  pauseFullscreenButton: HTMLButtonElement;
  pauseResetButton: HTMLButtonElement;
  oreInventory: HTMLDivElement;
  oreList: HTMLDivElement;
  oreCloseButton: HTMLButtonElement;
  waterVision: HTMLDivElement;
  caveVignette: HTMLDivElement;
  jumpscareOverlay: HTMLDivElement;
  jumpscareImage: HTMLImageElement;
} {
  const ui = document.createElement('div');
  ui.innerHTML = `
    <div class="loading-screen" id="loading-screen">
      <div class="loading-panel">
        <h1 class="loading-title">Voxel<br />Sandbox</h1>
        <p class="loading-subtitle">Engine boot</p>
        <div class="progress-shell"><div class="progress-bar" id="progress-bar"></div></div>
        <div class="loading-row">
          <span id="loading-status">Initialisiere Renderer</span>
          <span class="loading-percent" id="loading-percent">0%</span>
        </div>
        <div class="device-choice" id="device-choice">
          <button class="device-button" id="computer-button" type="button" disabled>Computer</button>
          <button class="device-button" id="mobile-button" type="button" disabled>Handy</button>
        </div>
      </div>
    </div>
    <div class="hud">
      <button class="fullscreen-button" id="fullscreen-button" type="button" aria-label="Fullscreen">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
        </svg>
      </button>
      <div class="top-bar">
        <div class="target-chip" id="target-chip">Grass</div>
        <button class="reset-button" id="reset-button" type="button">Reset</button>
      </div>
      <div class="crosshair" aria-hidden="true"></div>
      <div class="hotbar" id="hotbar"></div>
    </div>
    <div class="mobile-controls" id="mobile-controls" hidden aria-hidden="true">
      <div class="mobile-joystick" id="mobile-joystick" aria-hidden="true">
        <div class="mobile-joystick-knob" id="mobile-joystick-knob"></div>
      </div>
      <button class="mobile-inventory-button" id="mobile-inventory-button" type="button" aria-label="Erz-Inventar">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 4h10l3 5-8 11L4 9l3-5Z" />
          <path d="M4 9h16" />
          <path d="m9 4 3 16 3-16" />
        </svg>
      </button>
      <div class="mobile-move-buttons">
        <button class="mobile-move-button" id="mobile-jump-button" type="button" aria-label="Springen">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4v14" />
            <path d="m6 10 6-6 6 6" />
          </svg>
        </button>
        <button class="mobile-move-button" id="mobile-crouch-button" type="button" aria-label="Ducken">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20V6" />
            <path d="m6 14 6 6 6-6" />
          </svg>
        </button>
      </div>
      <div class="mobile-actions">
        <button class="mobile-action-button" id="mobile-mine-button" type="button" aria-label="Block abbauen">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14.5 3.5 20 9l-2 2-2.3-2.3-8.8 8.8-2.4 1.1 1.1-2.4 8.8-8.8L12.5 5.5l2-2Z" />
            <path d="m4 20 4-4" />
          </svg>
        </button>
        <button class="mobile-action-button" id="mobile-place-button" type="button" aria-label="Block platzieren">
          <span class="mobile-block-icon"></span>
        </button>
      </div>
    </div>
    <div class="resume-layer" id="resume-layer">
      <button class="resume-button" id="resume-button" type="button">Fortsetzen</button>
    </div>
    <div class="pause-menu" id="pause-menu" hidden>
      <div class="pause-panel">
        <h2 class="pause-title">Pause</h2>
        <button class="pause-button" id="pause-resume-button" type="button">Fortsetzen</button>
        <button class="pause-button" id="pause-fullscreen-button" type="button">Fullscreen</button>
        <button class="pause-button is-danger" id="pause-reset-button" type="button">Welt resetten</button>
      </div>
    </div>
    <div class="ore-inventory" id="ore-inventory" hidden>
      <div class="ore-panel">
        <div class="ore-header">
          <h2 class="ore-title">Erze</h2>
          <button class="ore-close-button" id="ore-close-button" type="button">Schliessen</button>
        </div>
        <div class="ore-list" id="ore-list"></div>
      </div>
    </div>
    <div class="water-vision" id="water-vision" aria-hidden="true"></div>
    <div class="cave-vignette" id="cave-vignette" aria-hidden="true"></div>
    <div class="jumpscare-overlay" id="jumpscare-overlay" hidden aria-hidden="true">
      <img class="jumpscare-image" id="jumpscare-image" alt="" />
    </div>
  `;

  document.body.appendChild(ui);

  return {
    loading: document.querySelector<HTMLDivElement>('#loading-screen')!,
    progressBar: document.querySelector<HTMLDivElement>('#progress-bar')!,
    loadingStatus: document.querySelector<HTMLSpanElement>('#loading-status')!,
    loadingPercent: document.querySelector<HTMLSpanElement>('#loading-percent')!,
    computerButton: document.querySelector<HTMLButtonElement>('#computer-button')!,
    mobileButton: document.querySelector<HTMLButtonElement>('#mobile-button')!,
    fullscreenButton: document.querySelector<HTMLButtonElement>('#fullscreen-button')!,
    resetButton: document.querySelector<HTMLButtonElement>('#reset-button')!,
    hotbar: document.querySelector<HTMLDivElement>('#hotbar')!,
    targetChip: document.querySelector<HTMLDivElement>('#target-chip')!,
    mobileControls: document.querySelector<HTMLDivElement>('#mobile-controls')!,
    mobileJoystick: document.querySelector<HTMLDivElement>('#mobile-joystick')!,
    mobileJoystickKnob: document.querySelector<HTMLDivElement>('#mobile-joystick-knob')!,
    mobileJumpButton: document.querySelector<HTMLButtonElement>('#mobile-jump-button')!,
    mobileCrouchButton: document.querySelector<HTMLButtonElement>('#mobile-crouch-button')!,
    mobileMineButton: document.querySelector<HTMLButtonElement>('#mobile-mine-button')!,
    mobilePlaceButton: document.querySelector<HTMLButtonElement>('#mobile-place-button')!,
    mobileInventoryButton: document.querySelector<HTMLButtonElement>('#mobile-inventory-button')!,
    resumeLayer: document.querySelector<HTMLDivElement>('#resume-layer')!,
    resumeButton: document.querySelector<HTMLButtonElement>('#resume-button')!,
    pauseMenu: document.querySelector<HTMLDivElement>('#pause-menu')!,
    pauseResumeButton: document.querySelector<HTMLButtonElement>('#pause-resume-button')!,
    pauseFullscreenButton: document.querySelector<HTMLButtonElement>('#pause-fullscreen-button')!,
    pauseResetButton: document.querySelector<HTMLButtonElement>('#pause-reset-button')!,
    oreInventory: document.querySelector<HTMLDivElement>('#ore-inventory')!,
    oreList: document.querySelector<HTMLDivElement>('#ore-list')!,
    oreCloseButton: document.querySelector<HTMLButtonElement>('#ore-close-button')!,
    waterVision: document.querySelector<HTMLDivElement>('#water-vision')!,
    caveVignette: document.querySelector<HTMLDivElement>('#cave-vignette')!,
    jumpscareOverlay: document.querySelector<HTMLDivElement>('#jumpscare-overlay')!,
    jumpscareImage: document.querySelector<HTMLImageElement>('#jumpscare-image')!
  };
}

function updateLoading(
  ui: ReturnType<typeof createUi>,
  progress: number,
  status: string
): void {
  const clamped = clamp(progress, 0, 1);
  ui.progressBar.style.width = `${Math.round(clamped * 100)}%`;
  ui.loadingStatus.textContent = status;
  ui.loadingPercent.textContent = `${Math.round(clamped * 100)}%`;
}

function setupHotbar(
  hotbar: HTMLElement,
  onSelect: (item: HotbarItemId) => void
): Map<HotbarItemId, HTMLButtonElement> {
  const buttons = new Map<HotbarItemId, HTMLButtonElement>();

  for (const item of hotbarItems) {
    const button = document.createElement('button');
    button.className = 'slot';
    button.type = 'button';
    button.style.setProperty('--swatch', item.swatch);
    button.dataset.item = item.id;
    button.classList.toggle('is-tool', item.kind === 'tool');
    button.innerHTML = `
      <span class="slot-number">${item.slot}</span>
      <span class="slot-swatch"></span>
      <span class="slot-label">${item.name}</span>
    `;
    button.addEventListener('click', () => onSelect(item.id));
    hotbar.appendChild(button);
    buttons.set(item.id, button);
  }

  return buttons;
}

async function loadGameAssets(
  renderer: THREE.WebGLRenderer,
  ui: ReturnType<typeof createUi>
): Promise<{
  materials: Record<BlockId, THREE.Material>;
  skyTexture: THREE.Texture;
  waterMaterial: THREE.MeshStandardMaterial;
}> {
  updateLoading(ui, 0.05, 'Initialisiere Asset-Pipeline');

  const manager = new THREE.LoadingManager();
  const textureLoader = new THREE.TextureLoader(manager);
  textureLoader.setCrossOrigin(
    window.location.protocol === 'file:' ? (undefined as unknown as string) : 'anonymous'
  );
  const anisotropy = renderer.capabilities.getMaxAnisotropy();

  manager.onProgress = (_url, loaded, total) => {
    const progress = total > 0 ? loaded / total : 0;
    updateLoading(ui, 0.08 + progress * 0.72, 'Lade Texturen und Himmel');
  };

  const texturePromises = Object.entries(texturePaths).map(async ([block, path]) => {
    const textures = await loadTextureSet(
      textureLoader,
      path,
      anisotropy,
      block as MutableBlockId
    );
    blockRegistry[block as MutableBlockId].material = createPbrMaterial(
      block as MutableBlockId,
      textures
    );
  });

  const skyTexture = createSkyFallbackTexture();
  skyTexture.mapping = THREE.EquirectangularReflectionMapping;

  await Promise.all(texturePromises);
  const waterMaterial = createWaterMaterial();
  blockRegistry.water.material = waterMaterial;

  for (const ore of oreBlockIds) {
    blockRegistry[ore].material = createOreMaterial(ore, anisotropy);
  }

  const materials = materialBlockIds.reduce(
    (accumulator, blockId) => {
      const material = blockRegistry[blockId].material;

      if (!material) {
        throw new Error(`Missing material for ${blockId}`);
      }

      accumulator[blockId] = material;
      return accumulator;
    },
    {} as Record<BlockId, THREE.Material>
  );

  updateLoading(ui, 0.84, 'Baue Welt');
  return { materials, skyTexture, waterMaterial };
}

async function loadTextureSet(
  loader: THREE.TextureLoader,
  path: string,
  anisotropy: number,
  block: MutableBlockId
): Promise<TextureSet> {
  if (block === 'sand' || block === 'leaves') {
    return { map: createFallbackTexture(block, anisotropy) };
  }

  const map = await loadTexture(loader, assetUrl(`${path}/color.jpg`), anisotropy, true).catch(() =>
    createFallbackTexture(block, anisotropy)
  );

  return { map };
}

function loadTexture(
  loader: THREE.TextureLoader,
  url: string,
  anisotropy: number,
  color: boolean
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error(`Texture load timed out: ${url}`));
      }
    }, 8_000);

    loader.load(
      url,
      (texture) => {
        if (settled) {
          return;
        }

        settled = true;
        window.clearTimeout(timeout);
        prepareTexture(texture, anisotropy, color);
        resolve(texture);
      },
      undefined,
      (error) => {
        if (settled) {
          return;
        }

        settled = true;
        window.clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

function prepareTexture(texture: THREE.Texture, anisotropy: number, color: boolean): void {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  downscaleTexture(texture, color ? 512 : 256);
}

function assetUrl(path: string): string {
  const normalizedPath = path.replace(/\\/g, '/');
  const embeddedAsset = window.__VOXEL_ASSETS__?.[normalizedPath];

  if (embeddedAsset) {
    return embeddedAsset;
  }

  const pagePath = window.location.pathname.replace(/\\/g, '/');
  const assetBase = pagePath.includes('/dist/') ? 'assets' : 'dist/assets';
  return new URL(`${assetBase}/${normalizedPath}`, window.location.href).toString();
}

function downscaleTexture(texture: THREE.Texture, maxSize: number): void {
  const source = texture.image as CanvasImageSource & {
    naturalWidth?: number;
    naturalHeight?: number;
    width: number;
    height: number;
  };
  const width = source.naturalWidth ?? source.width;
  const height = source.naturalHeight ?? source.height;

  if (!width || !height || (width <= maxSize && height <= maxSize)) {
    return;
  }

  const scale = maxSize / Math.max(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d')!;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  texture.image = canvas;
  texture.needsUpdate = true;
}

function createFallbackTexture(block: MutableBlockId, anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d')!;
  const baseColor = new THREE.Color(swatches[block]);
  context.fillStyle = `#${baseColor.getHexString()}`;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 8) {
    for (let x = 0; x < canvas.width; x += 8) {
      const noise = (hash2(x, y, TEXTURE_SEED + block.length * 13) - 0.5) * 42;
      const color = baseColor.clone().offsetHSL(0, 0, noise / 255);
      context.fillStyle = `#${color.getHexString()}`;
      context.fillRect(x, y, 8, 8);
    }
  }

  if (block === 'planks' || block === 'log') {
    context.strokeStyle = 'rgba(40, 23, 12, 0.38)';
    context.lineWidth = 3;

    for (let y = 18; y < canvas.height; y += 26) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y + Math.sin(y) * 3);
      context.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  prepareTexture(texture, anisotropy, true);
  return texture;
}

function createOreMaterial(ore: OreBlockId, anisotropy: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    name: ore,
    map: createOreTexture(ore, anisotropy),
    roughness: 0.96,
    metalness: 0,
    envMapIntensity: 0.18
  });
}

function createOreTexture(ore: OreBlockId, anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d')!;
  const pixelSize = 8;
  const gridSize = canvas.width / pixelSize;
  const stonePalette = ['#686966', '#747571', '#82837d', '#8d8d86', '#5d5f5d'];
  const orePalette = orePixelPalettes[ore];
  const orePixels = createOrePixelSet(ore, gridSize);

  context.imageSmoothingEnabled = false;

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const color = pickPaletteColor(stonePalette, x, y, TEXTURE_SEED + ore.length * 17);
      context.fillStyle = color;
      context.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }

  for (const key of orePixels) {
    const [x, y] = key.split(',').map(Number);

    for (const [offsetX, offsetY] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1]
    ]) {
      const shadowX = x + offsetX;
      const shadowY = y + offsetY;

      if (
        shadowX >= 0 &&
        shadowX < gridSize &&
        shadowY >= 0 &&
        shadowY < gridSize &&
        !orePixels.has(`${shadowX},${shadowY}`)
      ) {
        context.fillStyle = '#555755';
        context.fillRect(shadowX * pixelSize, shadowY * pixelSize, pixelSize, pixelSize);
      }
    }
  }

  for (const key of orePixels) {
    const [x, y] = key.split(',').map(Number);
    const color = pickPaletteColor(orePalette, x, y, TEXTURE_SEED + ore.length * 43);
    context.fillStyle = color;
    context.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);

    if (hash2(x, y, TEXTURE_SEED + 997) > 0.62) {
      context.fillStyle = orePalette[orePalette.length - 1];
      context.fillRect(x * pixelSize, y * pixelSize, pixelSize / 2, pixelSize / 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  prepareTexture(texture, anisotropy, true);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  texture.generateMipmaps = true;
  return texture;
}

function createOrePixelSet(ore: OreBlockId, gridSize: number): Set<string> {
  const oreIndex = oreBlockIds.indexOf(ore);
  const clusterCount = ore === 'emerald_ore' ? 5 : ore === 'gold_ore' ? 6 : ore === 'coal_ore' ? 8 : 7;
  const shapeVariants = [
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1]
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
      [1, 2]
    ],
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2]
    ],
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [0, 2],
      [1, 2]
    ]
  ];
  const pixels = new Set<string>();

  for (let i = 0; i < clusterCount; i += 1) {
    const shape = shapeVariants[(i + oreIndex) % shapeVariants.length];
    const centerX = 1 + Math.floor(hash2(i, oreIndex + 3, TEXTURE_SEED + 251) * (gridSize - 4));
    const centerY = 1 + Math.floor(hash2(i, oreIndex + 7, TEXTURE_SEED + 293) * (gridSize - 4));
    const flipX = hash2(i, oreIndex + 11, TEXTURE_SEED + 337) > 0.5 ? -1 : 1;
    const flipY = hash2(i, oreIndex + 13, TEXTURE_SEED + 379) > 0.5 ? -1 : 1;

    for (const [offsetX, offsetY] of shape) {
      const x = clamp(centerX + offsetX * flipX, 0, gridSize - 1);
      const y = clamp(centerY + offsetY * flipY, 0, gridSize - 1);
      pixels.add(`${x},${y}`);
    }
  }

  return pixels;
}

function pickPaletteColor(palette: string[], x: number, y: number, seed: number): string {
  const index = Math.min(palette.length - 1, Math.floor(hash2(x, y, seed) * palette.length));
  return palette[index];
}

function createSkyFallbackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d')!;
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#6fb4ed');
  gradient.addColorStop(0.55, '#c8e4fb');
  gradient.addColorStop(1, '#f8e4bb');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = 'rgba(255, 255, 255, 0.72)';
  for (let i = 0; i < 18; i += 1) {
    const x = hash2(i, 4, TEXTURE_SEED) * canvas.width;
    const y = 55 + hash2(i, 9, TEXTURE_SEED) * 160;
    context.beginPath();
    context.ellipse(x, y, 52 + hash2(i, 1, TEXTURE_SEED) * 55, 13, 0, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPbrMaterial(block: MutableBlockId, textures: TextureSet): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    map: textures.map,
    roughness: block === 'stone' ? 0.86 : 0.74,
    metalness: 0,
    envMapIntensity: block === 'sand' ? 0.22 : 0.34
  });

  if (block === 'leaves') {
    material.roughness = 0.9;
  }

  material.name = block;
  return material;
}

function createWaterMaterial(): THREE.MeshStandardMaterial {
  const bumpMap = createWaterBumpTexture();

  return new THREE.MeshStandardMaterial({
    name: 'water',
    color: 0x52aeca,
    roughness: 0.2,
    metalness: 0,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
    envMapIntensity: 0.5,
    bumpMap,
    bumpScale: 0.04
  });
}

function createWaterBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#808080';
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 4) {
    const shade = 112 + Math.round(Math.sin(y * 0.18) * 24);
    context.strokeStyle = `rgb(${shade}, ${shade}, ${shade})`;
    context.beginPath();

    for (let x = 0; x <= canvas.width; x += 4) {
      const wave = Math.sin(x * 0.11 + y * 0.13) * 5;
      if (x === 0) {
        context.moveTo(x, y + wave);
      } else {
        context.lineTo(x, y + wave);
      }
    }

    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.7, 1.7);
  return texture;
}

async function main(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (!app) {
    throw new Error('Missing app root');
  }

  app.replaceChildren();

  const ui = createUi();
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });

  renderer.setPixelRatio(navigator.webdriver ? 1 : Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  app.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xd7d1c2, 0.009);

  const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 260);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  const hemiLight = new THREE.HemisphereLight(0xf7edd6, 0x51615e, 1.2);
  scene.add(hemiLight);

  const sun = new THREE.DirectionalLight(0xfff2d2, 2.25);
  sun.position.set(-26, 42, 21);
  sun.castShadow = false;
  sun.shadow.mapSize.set(1536, 1536);
  sun.shadow.camera.near = 8;
  sun.shadow.camera.far = 120;
  sun.shadow.camera.left = -54;
  sun.shadow.camera.right = 54;
  sun.shadow.camera.top = 54;
  sun.shadow.camera.bottom = -54;
  scene.add(sun);

  const caveLight = new THREE.PointLight(0xffc47a, 0, 15, 2.2);
  caveLight.position.set(0, -0.15, -0.2);
  camera.add(caveLight);

  const flashlightTarget = new THREE.Object3D();
  flashlightTarget.position.set(0.05, -0.04, -1);
  camera.add(flashlightTarget);

  const flashlight = new THREE.SpotLight(0xffdf9a, 0, 14, Math.PI / 9, 0.55, 2.1);
  flashlight.position.set(0.26, -0.2, -0.34);
  flashlight.castShadow = false;
  flashlight.target = flashlightTarget;
  camera.add(flashlight);

  const outdoorFogColor = new THREE.Color(0xd7d1c2);
  const caveFogColor = new THREE.Color(0x11161c);

  const { materials, skyTexture, waterMaterial } = await loadGameAssets(renderer, ui);
  scene.background = skyTexture;
  scene.environment = null;

  const world = new VoxelWorld(scene, materials);
  world.reset();

  const villagers = createVillageNpcs(world);
  scene.add(villagers.group);

  const caveMonster = createCaveMonster();
  scene.add(caveMonster.group);

  const hand = createHandModel();
  camera.add(hand.group);

  const highlight = createBlockHighlight();
  scene.add(highlight);

  const hotbarButtons = setupHotbar(ui.hotbar, selectHotbarItem);
  const clock = new THREE.Clock();
  const movementKeys = new Set<string>();
  const direction = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const mobileMove = new THREE.Vector2();
  const collisionCandidate = new THREE.Vector3();
  const horizontalVelocity = new THREE.Vector3();
  const monsterDirection = new THREE.Vector3();
  const monsterTarget = new THREE.Vector3();
  const monsterSide = new THREE.Vector3();

  let selectedHotbarItem: HotbarItemId = 'grass';
  let inputMode: InputMode = 'computer';
  let flashlightOn = false;
  let yaw = 0;
  let pitch = -0.04;
  let velocityY = 0;
  let isGrounded = false;
  let started = false;
  let isPaused = false;
  let isInventoryOpen = false;
  let swingTime = 0;
  let swingKind: 'mine' | 'place' = 'mine';
  let currentHit: RaycastHit | null = null;
  let currentCaveFactor = 0;
  let nextMonsterEmeraldGoal = MONSTER_EMERALD_INTERVAL;
  let monsterPending = false;
  let monsterActive = false;
  let monsterAiState: MonsterAiState = 'stalking';
  let monsterStalkTime = 0;
  let monsterAttackAfter = MONSTER_MIN_STALK_SECONDS;
  let monsterAmbushSide = 1;
  let isJumpscareActive = false;
  let jumpscareTimer = 0;
  let joystickPointerId: number | null = null;
  let mobileLookPointerId: number | null = null;
  let mobileJumpHeld = false;
  let mobileCrouchHeld = false;
  let mobileLookX = 0;
  let mobileLookY = 0;
  const oreCounts = new Map<OreBlockId, number>(oreBlockIds.map((ore) => [ore, 0]));

  ui.jumpscareImage.src = createJumpscareImageDataUrl();
  camera.position.copy(world.getSpawnPosition());
  camera.rotation.set(pitch, yaw, 0);
  selectHotbarItem(selectedHotbarItem);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  document.addEventListener('keydown', (event) => {
    if (event.code === 'Escape' && document.fullscreenElement) {
      event.preventDefault();
      exitFullscreen();
      return;
    }

    if (isJumpscareActive) {
      event.preventDefault();
      return;
    }

    if (event.code === 'KeyE' && started && !isPaused) {
      event.preventDefault();
      setInventoryOpen(!isInventoryOpen);
      return;
    }

    if (event.code === 'KeyP' && started) {
      event.preventDefault();
      setInventoryOpen(false, false);
      setPaused(!isPaused);
      return;
    }

    if (isPaused || isInventoryOpen) {
      return;
    }

    movementKeys.add(event.code);

    if (document.pointerLockElement === renderer.domElement) {
      if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyC'].includes(event.code)) {
        event.preventDefault();
      }
    }

    if (event.code.startsWith('Digit')) {
      const slot = Number(event.code.replace('Digit', ''));
      const item = hotbarItems.find((candidate) => candidate.slot === slot);

      if (item) {
        selectHotbarItem(item.id);
      }
    }
  });

  document.addEventListener('keyup', (event) => {
    movementKeys.delete(event.code);
  });

  document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement !== renderer.domElement || !started || isPaused || isInventoryOpen || isJumpscareActive) {
      return;
    }

    yaw -= event.movementX * COMPUTER_LOOK_SENSITIVITY;
    pitch -= event.movementY * COMPUTER_LOOK_SENSITIVITY;
    pitch = clamp(pitch, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
    camera.rotation.set(pitch, yaw, 0);
  });

  document.addEventListener('pointerlockchange', () => {
    ui.resumeLayer.classList.toggle(
      'is-visible',
      inputMode === 'computer' &&
        started &&
        !isPaused &&
        !isInventoryOpen &&
        !isJumpscareActive &&
        document.pointerLockElement !== renderer.domElement
    );
  });

  document.addEventListener('fullscreenchange', updateFullscreenButtonState);

  renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
  renderer.domElement.addEventListener('click', () => {
    if (
      inputMode === 'computer' &&
      started &&
      !isPaused &&
      !isInventoryOpen &&
      !isJumpscareActive &&
      document.pointerLockElement !== renderer.domElement
    ) {
      requestPointerLock(renderer.domElement);
    }
  });

  renderer.domElement.addEventListener('mousedown', (event) => {
    if (!started || isPaused || isInventoryOpen || isJumpscareActive || document.pointerLockElement !== renderer.domElement) {
      return;
    }

    if (event.button === 0) {
      mineBlock();
    } else if (event.button === 2) {
      if (selectedHotbarItem === FLASHLIGHT_ITEM_ID) {
        toggleFlashlight();
      } else {
        placeBlock();
      }
    }
  });

  renderer.domElement.addEventListener(
    'wheel',
    (event) => {
      if (!started || isPaused || isInventoryOpen || isJumpscareActive) {
        return;
      }

      event.preventDefault();
      selectAdjacentHotbarItem(event.deltaY > 0 ? 1 : -1);
    },
    { passive: false }
  );

  renderer.domElement.addEventListener('pointerdown', (event) => {
    if (!isMobileControlsActive() || mobileLookPointerId !== null) {
      return;
    }

    mobileLookPointerId = event.pointerId;
    mobileLookX = event.clientX;
    mobileLookY = event.clientY;
    renderer.domElement.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  renderer.domElement.addEventListener('pointermove', (event) => {
    if (mobileLookPointerId !== event.pointerId || !isMobileControlsActive()) {
      return;
    }

    const deltaX = event.clientX - mobileLookX;
    const deltaY = event.clientY - mobileLookY;
    mobileLookX = event.clientX;
    mobileLookY = event.clientY;
    yaw -= deltaX * MOBILE_LOOK_SENSITIVITY;
    pitch -= deltaY * MOBILE_LOOK_SENSITIVITY;
    pitch = clamp(pitch, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
    camera.rotation.set(pitch, yaw, 0);
    event.preventDefault();
  });

  for (const eventName of ['pointerup', 'pointercancel'] as const) {
    renderer.domElement.addEventListener(eventName, (event) => {
      if (mobileLookPointerId === event.pointerId) {
        mobileLookPointerId = null;
      }
    });
  }

  ui.mobileJoystick.addEventListener('pointerdown', (event) => {
    if (!isMobileControlsActive()) {
      return;
    }

    joystickPointerId = event.pointerId;
    ui.mobileJoystick.setPointerCapture(event.pointerId);
    updateMobileJoystick(event);
    event.preventDefault();
  });

  ui.mobileJoystick.addEventListener('pointermove', (event) => {
    if (joystickPointerId !== event.pointerId) {
      return;
    }

    updateMobileJoystick(event);
    event.preventDefault();
  });

  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    ui.mobileJoystick.addEventListener(eventName, (event) => {
      if ('pointerId' in event && joystickPointerId !== event.pointerId) {
        return;
      }

      resetMobileJoystick();
    });
  }

  ui.mobileMineButton.addEventListener('pointerdown', (event) => {
    if (isMobileControlsActive()) {
      mineBlock();
      startSwing('mine');
    }

    event.preventDefault();
  });

  ui.mobilePlaceButton.addEventListener('pointerdown', (event) => {
    if (isMobileControlsActive()) {
      if (selectedHotbarItem === FLASHLIGHT_ITEM_ID) {
        toggleFlashlight();
      } else {
        placeBlock();
      }
    }

    event.preventDefault();
  });

  ui.mobileInventoryButton.addEventListener('pointerdown', (event) => {
    if (inputMode === 'mobile' && started && !isPaused && !isJumpscareActive) {
      setInventoryOpen(true);
    }

    event.preventDefault();
  });

  bindMobileHoldButton(ui.mobileJumpButton, (held) => {
    mobileJumpHeld = held;
  });
  bindMobileHoldButton(ui.mobileCrouchButton, (held) => {
    mobileCrouchHeld = held;
  });

  ui.computerButton.addEventListener('click', () => startGame('computer'));
  ui.mobileButton.addEventListener('click', () => startGame('mobile'));

  ui.fullscreenButton.addEventListener('click', () => toggleFullscreen());
  ui.resumeButton.addEventListener('click', () => {
    if (inputMode === 'computer') {
      requestPointerLock(renderer.domElement);
    }
  });
  ui.resetButton.addEventListener('click', () => resetWorld());
  ui.pauseResumeButton.addEventListener('click', () => setPaused(false));
  ui.pauseFullscreenButton.addEventListener('click', () => toggleFullscreen());
  ui.pauseResetButton.addEventListener('click', () => resetWorld());
  ui.oreCloseButton.addEventListener('click', () => setInventoryOpen(false));
  updateOreInventory();

  updateLoading(ui, 1, 'Waehle Steuerung');
  ui.computerButton.disabled = false;
  ui.mobileButton.disabled = false;
  updateFullscreenButtonState();
  document.body.dataset.ready = 'true';

  renderer.setAnimationLoop(() => {
    const delta = Math.min(clock.getDelta(), 0.05);

    if (!isJumpscareActive) {
      updatePlayer(delta);
    } else {
      horizontalVelocity.set(0, 0, 0);
      velocityY = 0;
    }

    updateTarget();
    updateHand(delta);
    updateWater(clock.elapsedTime);
    updateWaterVision(clock.elapsedTime);
    villagers.update(delta, clock.elapsedTime, world);
    currentCaveFactor = updateCaveAtmosphere(clock.elapsedTime);
    updateCaveMonster(delta, clock.elapsedTime, currentCaveFactor);
    world.flushChunkUpdates(3);
    renderer.render(scene, camera);
  });

  window.voxelDebug = {
    countBlocks: () => world.countBlocks(),
    getBlock: (x, y, z) => world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)),
    placeBlock: (x, y, z, block) =>
      world.placeBlock({ x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) }, block),
    removeBlock: (x, y, z) =>
      world.removeBlock({ x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) }),
    resetWorld: () => resetWorld(),
    spawn: () => {
      const position = world.getSpawnPosition();
      return { x: position.x, y: position.y, z: position.z };
    },
    seed: () => world.getSeed(),
    worldSize: () => ({ min: WORLD_MIN, max: WORLD_MAX, width: WORLD_WIDTH })
  };

  function startGame(mode: InputMode): void {
    inputMode = mode;
    started = true;
    isPaused = false;
    mobileMove.set(0, 0);
    resetMobileJoystick();
    document.body.classList.toggle('mobile-mode', inputMode === 'mobile');
    ui.mobileControls.hidden = inputMode !== 'mobile';
    ui.mobileControls.setAttribute('aria-hidden', inputMode === 'mobile' ? 'false' : 'true');
    ui.resumeLayer.classList.remove('is-visible');
    ui.loading.classList.add('is-hidden');
    ui.loading.hidden = true;

    if (inputMode === 'computer') {
      requestPointerLock(renderer.domElement);
    }
  }

  function isMobileControlsActive(): boolean {
    return inputMode === 'mobile' && started && !isPaused && !isInventoryOpen && !isJumpscareActive;
  }

  function updateMobileJoystick(event: PointerEvent): void {
    const bounds = ui.mobileJoystick.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const maxDistance = bounds.width * 0.34;
    const rawX = event.clientX - centerX;
    const rawY = event.clientY - centerY;
    const distance = Math.min(Math.hypot(rawX, rawY), maxDistance);
    const angle = Math.atan2(rawY, rawX);
    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;

    mobileMove.set(offsetX / maxDistance, offsetY / maxDistance);
    ui.mobileJoystickKnob.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`;
  }

  function resetMobileJoystick(): void {
    joystickPointerId = null;
    mobileMove.set(0, 0);
    mobileJumpHeld = false;
    mobileCrouchHeld = false;
    ui.mobileJoystickKnob.style.transform = 'translate(-50%, -50%)';
    ui.mobileJumpButton.classList.remove('is-held');
    ui.mobileCrouchButton.classList.remove('is-held');
  }

  function bindMobileHoldButton(
    button: HTMLButtonElement,
    onChange: (held: boolean) => void
  ): void {
    button.addEventListener('pointerdown', (event) => {
      if (!isMobileControlsActive()) {
        return;
      }

      button.setPointerCapture(event.pointerId);
      button.classList.add('is-held');
      onChange(true);
      event.preventDefault();
    });

    const release = (event: PointerEvent) => {
      button.classList.remove('is-held');
      onChange(false);
      event.preventDefault();
    };

    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  }

  function toggleFullscreen(): void {
    if (document.fullscreenElement) {
      exitFullscreen();
      return;
    }

    void Promise.resolve(document.documentElement.requestFullscreen()).catch(() => undefined);
  }

  function exitFullscreen(): void {
    if (document.fullscreenElement) {
      void Promise.resolve(document.exitFullscreen()).catch(() => undefined);
    }
  }

  function updateFullscreenButtonState(): void {
    const isFullscreen = Boolean(document.fullscreenElement);
    ui.fullscreenButton.classList.toggle('is-on', isFullscreen);
    ui.fullscreenButton.setAttribute('aria-label', isFullscreen ? 'Fullscreen verlassen' : 'Fullscreen');
    ui.pauseFullscreenButton.textContent = isFullscreen ? 'Fullscreen verlassen' : 'Fullscreen';
    ui.pauseFullscreenButton.classList.toggle('is-on', isFullscreen);
  }

  function selectHotbarItem(item: HotbarItemId): void {
    selectedHotbarItem = item;
    ui.targetChip.textContent = getSelectedHotbarLabel();
    hand.flashlight.visible = item === FLASHLIGHT_ITEM_ID;
    ui.mobilePlaceButton.style.setProperty(
      '--selected-block',
      isPlaceableHotbarItem(item) ? swatches[item] : '#ffd36a'
    );
    refreshHotbarButtons();
  }

  function selectAdjacentHotbarItem(directionStep: number): void {
    const currentIndex = hotbarItems.findIndex((item) => item.id === selectedHotbarItem);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (safeIndex + directionStep + hotbarItems.length) % hotbarItems.length;
    selectHotbarItem(hotbarItems[nextIndex].id);
  }

  function refreshHotbarButtons(): void {
    for (const [itemId, button] of hotbarButtons) {
      button.classList.toggle('is-selected', itemId === selectedHotbarItem);
      button.classList.toggle('is-on', itemId === FLASHLIGHT_ITEM_ID && flashlightOn);
    }
  }

  function getSelectedHotbarLabel(): string {
    if (selectedHotbarItem === FLASHLIGHT_ITEM_ID) {
      return `Taschenlampe ${flashlightOn ? 'an' : 'aus'}`;
    }

    return blockRegistry[selectedHotbarItem].name;
  }

  function mineBlock(): void {
    if (!currentHit) {
      return;
    }

    const removed = world.removeBlock(currentHit.position);

    if (removed) {
      collectOre(removed);
      startSwing('mine');
    }
  }

  function toggleFlashlight(): void {
    flashlightOn = !flashlightOn;
    ui.targetChip.textContent = getSelectedHotbarLabel();
    refreshHotbarButtons();
    startSwing('place');
  }

  function placeBlock(): void {
    if (!isPlaceableHotbarItem(selectedHotbarItem)) {
      return;
    }

    if (!currentHit || currentHit.normal.lengthSq() === 0) {
      return;
    }

    const selectedBlock = selectedHotbarItem;

    const position = {
      x: currentHit.position.x + currentHit.normal.x,
      y: currentHit.position.y + currentHit.normal.y,
      z: currentHit.position.z + currentHit.normal.z
    };

    if (blockIntersectsPlayer(position, camera.position)) {
      return;
    }

    if (placementWouldTrapPlayer(world, position, selectedBlock, camera.position)) {
      return;
    }

    if (world.placeBlock(position, selectedBlock)) {
      startSwing('place');
    }
  }

  function resetWorld(): void {
    world.reset();
    camera.position.copy(world.getSpawnPosition());
    horizontalVelocity.set(0, 0, 0);
    resetMobileJoystick();
    velocityY = 0;
    isGrounded = false;
    flashlightOn = false;
    stopMonsterChase();
    monsterPending = false;
    nextMonsterEmeraldGoal = MONSTER_EMERALD_INTERVAL;
    hideJumpscare();
    resetOreInventory();
    villagers.reset(world);
    yaw = 0;
    pitch = -0.04;
    camera.rotation.set(pitch, yaw, 0);
    refreshHotbarButtons();
  }

  function updateCaveAtmosphere(time: number): number {
    const caveFactor = getCaveFactor(world, camera.position);
    scene.fog?.color.copy(outdoorFogColor).lerp(caveFogColor, caveFactor);

    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density = lerp(0.009, 0.034, caveFactor);
    }

    hemiLight.intensity = lerp(1.2, 0.58, caveFactor);
    sun.intensity = lerp(2.25, 0.28, caveFactor);
    caveLight.intensity = lerp(0, 1.05, caveFactor);
    renderer.toneMappingExposure = lerp(0.9, 0.82, caveFactor);
    ui.caveVignette.style.opacity = `${caveFactor * 0.42}`;
    updateFlashlight(caveFactor, time);
    return caveFactor;
  }

  function updateFlashlight(caveFactor: number, time: number): void {
    const isActive = flashlightOn && selectedHotbarItem === FLASHLIGHT_ITEM_ID;

    if (!isActive) {
      flashlight.intensity = 0;
      return;
    }

    const spookyFlicker =
      caveFactor > 0.25
        ? clamp(
            0.86 + Math.sin(time * 19.5) * 0.08 + Math.sin(time * 46.7) * 0.055,
            0.62,
            1.04
          )
        : 1;

    flashlight.intensity = lerp(2.4, 4.2, caveFactor) * spookyFlicker;
    flashlight.distance = lerp(12, 16, caveFactor);
    flashlight.angle = lerp(Math.PI / 10, Math.PI / 8, caveFactor);
  }

  function updateCaveMonster(delta: number, time: number, caveFactor: number): void {
    if (isJumpscareActive) {
      updateJumpscare(delta);
      return;
    }

    if (monsterPending && !monsterActive && caveFactor >= MONSTER_CAVE_THRESHOLD) {
      startMonsterChase();
    }

    if (!monsterActive) {
      return;
    }

    monsterStalkTime += delta;
    const playerIsLooking = isPlayerLookingAtMonster();
    const distanceToPlayer = caveMonster.group.position.distanceTo(camera.position);

    if (monsterAiState === 'stalking') {
      updateMonsterStalking(delta, time, caveFactor, playerIsLooking, distanceToPlayer);
    } else {
      updateMonsterAttack(delta, time, caveFactor);
    }

    caveMonster.group.lookAt(camera.position.x, caveMonster.group.position.y, camera.position.z);
    animateCaveMonster(caveMonster, time, distanceToPlayer, monsterAiState);
  }

  function updateMonsterStalking(
    delta: number,
    time: number,
    caveFactor: number,
    playerIsLooking: boolean,
    distanceToPlayer: number
  ): void {
    if (playerIsLooking) {
      monsterAmbushSide *= -1;
    }

    camera.getWorldDirection(forward);
    forward.y = 0;

    if (forward.lengthSq() < 0.001) {
      forward.set(0, 0, -1);
    }

    forward.normalize();
    monsterSide.set(-forward.z, 0, forward.x).multiplyScalar(monsterAmbushSide);

    const pulse = 0.5 + Math.sin(time * 0.41) * 0.5;
    const desiredDistance = playerIsLooking
      ? MONSTER_STALK_DISTANCE + 18
      : MONSTER_STALK_DISTANCE + pulse * 9;
    const sideDistance = MONSTER_STALK_SIDE_DISTANCE + pulse * 5;

    monsterTarget
      .copy(camera.position)
      .addScaledVector(forward, -desiredDistance)
      .addScaledVector(monsterSide, sideDistance);
    monsterTarget.y = camera.position.y - PLAYER_EYE_HEIGHT - 0.1;

    moveMonsterToward(monsterTarget, (playerIsLooking ? MONSTER_RETREAT_SPEED : MONSTER_STALK_SPEED) * delta);

    const shouldAttack =
      monsterStalkTime >= monsterAttackAfter &&
      !playerIsLooking &&
      distanceToPlayer < MONSTER_STALK_DISTANCE + 10 &&
      caveFactor >= MONSTER_CAVE_THRESHOLD;

    if (shouldAttack) {
      monsterAiState = 'attacking';
      caveMonster.light.intensity = 1.35;
    }
  }

  function updateMonsterAttack(
    delta: number,
    time: number,
    caveFactor: number
  ): void {
    monsterTarget.set(camera.position.x, camera.position.y - PLAYER_EYE_HEIGHT, camera.position.z);

    if (caveMonster.group.position.distanceTo(monsterTarget) <= MONSTER_CATCH_DISTANCE) {
      triggerJumpscare();
      return;
    }

    moveMonsterToward(monsterTarget, (MONSTER_ATTACK_SPEED + caveFactor * 2.1 + Math.sin(time * 9) * 0.35) * delta);

    if (caveMonster.group.position.distanceTo(monsterTarget) <= MONSTER_CATCH_DISTANCE) {
      triggerJumpscare();
    }
  }

  function moveMonsterToward(target: THREE.Vector3, maxStep: number): void {
    monsterDirection.subVectors(target, caveMonster.group.position);
    monsterDirection.y *= 0.42;
    const distance = monsterDirection.length();

    if (distance <= 0.001) {
      return;
    }

    caveMonster.group.position.addScaledVector(monsterDirection.normalize(), Math.min(distance, maxStep));
  }

  function isPlayerLookingAtMonster(): boolean {
    camera.getWorldDirection(forward);
    monsterDirection.subVectors(caveMonster.group.position, camera.position);
    monsterDirection.y *= 0.32;
    const distance = monsterDirection.length();

    if (distance < 0.001) {
      return true;
    }

    return forward.normalize().dot(monsterDirection.normalize()) > 0.34 && distance < 44;
  }

  function startMonsterChase(): void {
    monsterPending = false;
    monsterActive = true;
    monsterAiState = 'stalking';
    monsterStalkTime = 0;
    monsterAttackAfter =
      MONSTER_MIN_STALK_SECONDS +
      hash2(Math.floor(camera.position.x), Math.floor(camera.position.z), world.getSeed() + nextMonsterEmeraldGoal) * 10;
    monsterAmbushSide =
      hash2(Math.floor(camera.position.x), Math.floor(camera.position.z), world.getSeed() + 919) > 0.5 ? 1 : -1;
    caveMonster.group.visible = true;
    camera.getWorldDirection(monsterDirection);
    monsterDirection.y = 0;

    if (monsterDirection.lengthSq() < 0.001) {
      monsterDirection.set(0, 0, -1);
    }

    monsterDirection.normalize();
    monsterSide.set(-monsterDirection.z, 0, monsterDirection.x).multiplyScalar(monsterAmbushSide);
    const offset = hash2(Math.floor(camera.position.x), Math.floor(camera.position.z), world.getSeed()) - 0.5;
    caveMonster.group.position.set(
      camera.position.x - monsterDirection.x * MONSTER_SPAWN_DISTANCE + monsterSide.x * (MONSTER_STALK_SIDE_DISTANCE + offset * 12),
      camera.position.y - PLAYER_EYE_HEIGHT - 0.1,
      camera.position.z - monsterDirection.z * MONSTER_SPAWN_DISTANCE + monsterSide.z * (MONSTER_STALK_SIDE_DISTANCE + offset * 12)
    );
    caveMonster.group.lookAt(camera.position.x, caveMonster.group.position.y, camera.position.z);
  }

  function stopMonsterChase(): void {
    monsterActive = false;
    monsterAiState = 'stalking';
    monsterStalkTime = 0;
    caveMonster.group.visible = false;
  }

  function triggerJumpscare(): void {
    stopMonsterChase();
    isJumpscareActive = true;
    jumpscareTimer = JUMPSCARE_SECONDS;
    movementKeys.clear();
    resetMobileJoystick();
    horizontalVelocity.set(0, 0, 0);
    velocityY = 0;
    ui.jumpscareOverlay.hidden = false;
    ui.jumpscareOverlay.setAttribute('aria-hidden', 'false');
    ui.jumpscareOverlay.classList.add('is-visible');
    ui.jumpscareImage.style.animation = 'none';
    void ui.jumpscareImage.offsetWidth;
    ui.jumpscareImage.style.animation = '';

    if (document.pointerLockElement === renderer.domElement) {
      document.exitPointerLock();
    }
  }

  function updateJumpscare(delta: number): void {
    jumpscareTimer -= delta;

    if (jumpscareTimer > 0) {
      return;
    }

    hideJumpscare();
    teleportPlayerToSurface();
    ui.resumeLayer.classList.toggle(
      'is-visible',
      inputMode === 'computer' &&
        started &&
        !isPaused &&
        !isInventoryOpen &&
        !isJumpscareActive &&
        document.pointerLockElement !== renderer.domElement
    );
  }

  function hideJumpscare(): void {
    isJumpscareActive = false;
    jumpscareTimer = 0;
    ui.jumpscareOverlay.classList.remove('is-visible');
    ui.jumpscareOverlay.setAttribute('aria-hidden', 'true');
    ui.jumpscareOverlay.hidden = true;
  }

  function teleportPlayerToSurface(): void {
    camera.position.y = world.getGroundSurfaceY(camera.position.x, camera.position.z) + PLAYER_EYE_HEIGHT + 1.2;
    horizontalVelocity.set(0, 0, 0);
    velocityY = 0;
    isGrounded = false;
  }

  function setPaused(paused: boolean): void {
    isPaused = paused;
    movementKeys.clear();
    horizontalVelocity.set(0, 0, 0);
    ui.pauseMenu.hidden = !isPaused;
    ui.pauseMenu.classList.toggle('is-visible', isPaused);
    ui.resumeLayer.classList.toggle(
      'is-visible',
      inputMode === 'computer' &&
        started &&
        !isPaused &&
        !isInventoryOpen &&
        !isJumpscareActive &&
        document.pointerLockElement !== renderer.domElement
    );

    if (isPaused) {
      resetMobileJoystick();

      if (document.pointerLockElement === renderer.domElement) {
        document.exitPointerLock();
      }

      return;
    }

    if (inputMode === 'computer') {
      requestPointerLock(renderer.domElement);
    }
  }

  function setInventoryOpen(open: boolean, requestLockOnClose = true): void {
    isInventoryOpen = open;
    movementKeys.clear();
    horizontalVelocity.set(0, 0, 0);
    ui.oreInventory.hidden = !isInventoryOpen;
    ui.oreInventory.classList.toggle('is-visible', isInventoryOpen);
    updateOreInventory();
    ui.resumeLayer.classList.toggle(
      'is-visible',
      inputMode === 'computer' &&
        started &&
        !isPaused &&
        !isInventoryOpen &&
        !isJumpscareActive &&
        document.pointerLockElement !== renderer.domElement
    );

    if (isInventoryOpen) {
      resetMobileJoystick();

      if (document.pointerLockElement === renderer.domElement) {
        document.exitPointerLock();
      }

      return;
    }

    if (requestLockOnClose && inputMode === 'computer' && started && !isPaused) {
      requestPointerLock(renderer.domElement);
    }
  }

  function collectOre(block: BlockId): void {
    if (!isOreBlock(block)) {
      return;
    }

    oreCounts.set(block, (oreCounts.get(block) ?? 0) + 1);
    updateOreInventory();

    if (block === 'emerald_ore') {
      const emeraldCount = oreCounts.get('emerald_ore') ?? 0;

      while (emeraldCount >= nextMonsterEmeraldGoal) {
        monsterPending = true;
        nextMonsterEmeraldGoal += MONSTER_EMERALD_INTERVAL;
      }

      if (monsterPending && currentCaveFactor >= MONSTER_CAVE_THRESHOLD) {
        startMonsterChase();
      }
    }
  }

  function resetOreInventory(): void {
    for (const ore of oreBlockIds) {
      oreCounts.set(ore, 0);
    }

    nextMonsterEmeraldGoal = MONSTER_EMERALD_INTERVAL;
    monsterPending = false;
    updateOreInventory();
  }

  function updateOreInventory(): void {
    ui.oreList.innerHTML = oreBlockIds
      .map((ore) => {
        const entry = blockRegistry[ore];
        return `
          <div class="ore-row">
            <span class="ore-swatch" style="--swatch: ${swatches[ore]}"></span>
            <span class="ore-name">${entry.name}</span>
            <span class="ore-count">${oreCounts.get(ore) ?? 0}</span>
          </div>
        `;
      })
      .join('');
  }

  function updatePlayer(delta: number): void {
    const controlsActive =
      started &&
      !isPaused &&
      !isInventoryOpen &&
      !isJumpscareActive &&
      (inputMode === 'mobile' || document.pointerLockElement === renderer.domElement);

    direction.set(0, 0, 0);

    if (controlsActive) {
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      right.crossVectors(forward, UP).normalize();

      if (movementKeys.has('KeyW')) {
        direction.add(forward);
      }

      if (movementKeys.has('KeyS')) {
        direction.sub(forward);
      }

      if (movementKeys.has('KeyD')) {
        direction.add(right);
      }

      if (movementKeys.has('KeyA')) {
        direction.sub(right);
      }

      if (inputMode === 'mobile' && mobileMove.lengthSq() > 0.01) {
        direction.addScaledVector(right, mobileMove.x);
        direction.addScaledVector(forward, -mobileMove.y);
      }
    }

    const waterBeforeMove = playerIntersectsWater(world, camera.position);
    updateHorizontalVelocity(delta, controlsActive, waterBeforeMove);

    if (horizontalVelocity.lengthSq() > 0.000001) {
      movePlayerHorizontally(horizontalVelocity.x * delta, horizontalVelocity.z * delta);
    }

    const playerInWater = playerIntersectsWater(world, camera.position);
    const jumpHeld = wantsJump();
    const swimUp = controlsActive && playerInWater && jumpHeld;

    if (controlsActive) {
      if (swimUp) {
        velocityY = approach(
          velocityY,
          PLAYER_SWIM_UP_SPEED,
          PLAYER_WATER_VERTICAL_ACCELERATION * delta
        );
      } else if (!playerInWater && jumpHeld && isGrounded) {
        velocityY = 7.2;
        isGrounded = false;
      }
    }

    if (playerInWater && !swimUp) {
      velocityY = approach(
        velocityY,
        PLAYER_WATER_SINK_SPEED,
        PLAYER_WATER_VERTICAL_ACCELERATION * delta
      );
    } else if (!playerInWater) {
      velocityY -= 22 * delta;
    }

    const verticalMove = resolveVerticalPlayerMove(
      world,
      camera.position,
      camera.position.y + velocityY * delta
    );

    camera.position.y = verticalMove.y;

    if (verticalMove.blocked) {
      velocityY = 0;
    }

    isGrounded = verticalMove.grounded;
  }

  function updateHorizontalVelocity(delta: number, controlsActive: boolean, playerInWater: boolean): void {
    if (!controlsActive) {
      horizontalVelocity.set(0, 0, 0);
      return;
    }

    if (direction.lengthSq() > 0) {
      direction.normalize();
      const acceleration = (
        playerInWater
          ? PLAYER_WATER_ACCELERATION
          : isGrounded
            ? PLAYER_GROUND_ACCELERATION
            : PLAYER_AIR_ACCELERATION
      ) * delta;
      const baseSpeed = playerInWater ? PLAYER_SWIM_SPEED : PLAYER_MOVE_SPEED;
      const targetSpeed = baseSpeed * (isSneaking() ? PLAYER_SNEAK_SPEED_MULTIPLIER : 1);
      horizontalVelocity.x = approach(
        horizontalVelocity.x,
        direction.x * targetSpeed,
        acceleration
      );
      horizontalVelocity.z = approach(
        horizontalVelocity.z,
        direction.z * targetSpeed,
        acceleration
      );
      return;
    }

    const friction = (
      playerInWater
        ? PLAYER_WATER_FRICTION
        : isGrounded
          ? PLAYER_GROUND_FRICTION
          : PLAYER_AIR_FRICTION
    ) * delta;
    horizontalVelocity.x = approach(horizontalVelocity.x, 0, friction);
    horizontalVelocity.z = approach(horizontalVelocity.z, 0, friction);
  }

  function movePlayerHorizontally(offsetX: number, offsetZ: number): void {
    if (offsetX !== 0) {
      collisionCandidate.copy(camera.position);
      collisionCandidate.x = clamp(
        collisionCandidate.x + offsetX,
        WORLD_MIN + 2,
        WORLD_MAX - 2
      );

      if (!playerIntersectsSolid(world, collisionCandidate) && canStandAfterHorizontalMove(collisionCandidate)) {
        camera.position.x = collisionCandidate.x;
      } else {
        horizontalVelocity.x = 0;
      }
    }

    if (offsetZ !== 0) {
      collisionCandidate.copy(camera.position);
      collisionCandidate.z = clamp(
        collisionCandidate.z + offsetZ,
        WORLD_MIN + 2,
        WORLD_MAX - 2
      );

      if (!playerIntersectsSolid(world, collisionCandidate) && canStandAfterHorizontalMove(collisionCandidate)) {
        camera.position.z = collisionCandidate.z;
      } else {
        horizontalVelocity.z = 0;
      }
    }
  }

  function canStandAfterHorizontalMove(position: THREE.Vector3): boolean {
    return !isSneaking() || playerHasGroundSupport(world, position);
  }

  function isSneaking(): boolean {
    return isGrounded && (movementKeys.has('KeyC') || (inputMode === 'mobile' && mobileCrouchHeld));
  }

  function wantsJump(): boolean {
    return movementKeys.has('Space') || (inputMode === 'mobile' && mobileJumpHeld);
  }

  function updateTarget(): void {
    camera.getWorldDirection(forward);
    currentHit = world.raycast(camera.position, forward, 7.5);

    if (currentHit) {
      highlight.visible = true;
      highlight.position.set(
        currentHit.position.x + 0.5,
        currentHit.position.y + 0.5,
        currentHit.position.z + 0.5
      );
      ui.targetChip.textContent = blockRegistry[currentHit.block].name;
    } else {
      highlight.visible = false;
      ui.targetChip.textContent = getSelectedHotbarLabel();
    }
  }

  function startSwing(kind: 'mine' | 'place'): void {
    swingKind = kind;
    swingTime = 0.24;
  }

  function updateHand(delta: number): void {
    swingTime = Math.max(0, swingTime - delta);
    const progress = swingTime > 0 ? 1 - swingTime / 0.24 : 1;
    const arc = swingTime > 0 ? Math.sin(progress * Math.PI) : 0;
    const placeBias = swingKind === 'place' ? 0.18 : 0;

    hand.group.position.set(0.52 - arc * 0.08, -0.46 - arc * 0.06, -0.82 - arc * 0.2);
    hand.group.rotation.set(-0.42 - arc * (0.82 - placeBias), -0.2 + arc * 0.16, 0.16 + arc * 0.24);
  }

  function updateWater(time: number): void {
    waterMaterial.opacity = 0.54 + Math.sin(time * 1.7) * 0.035;

    if (waterMaterial.bumpMap) {
      waterMaterial.bumpMap.offset.set(time * 0.018, time * 0.012);
    }
  }

  function updateWaterVision(time: number): void {
    const playerInWater = playerIntersectsWater(world, camera.position);

    if (!playerInWater || isJumpscareActive) {
      ui.waterVision.classList.remove('is-visible');
      ui.waterVision.style.removeProperty('--water-opacity');
      ui.waterVision.style.removeProperty('--water-drift');
      return;
    }

    const eyeBlock = world.getBlock(
      Math.floor(camera.position.x),
      Math.floor(camera.position.y),
      Math.floor(camera.position.z)
    );
    const baseOpacity = eyeBlock === 'water' ? 0.52 : 0.24;
    const wave = Math.sin(time * 2.4) * 0.035 + Math.sin(time * 5.1) * 0.018;

    ui.waterVision.classList.add('is-visible');
    ui.waterVision.style.setProperty('--water-opacity', `${clamp(baseOpacity + wave, 0.18, 0.58)}`);
    ui.waterVision.style.setProperty('--water-drift', `${Math.sin(time * 0.9) * 18}px`);
  }
}

function createHandModel(): { group: THREE.Group; flashlight: THREE.Group } {
  const group = new THREE.Group();
  const sleeveMaterial = new THREE.MeshStandardMaterial({
    color: 0x3b8e8c,
    roughness: 0.72,
    metalness: 0,
    depthTest: false,
    depthWrite: false
  });
  const handMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6a06c,
    roughness: 0.82,
    metalness: 0,
    depthTest: false,
    depthWrite: false
  });
  const cuffMaterial = new THREE.MeshStandardMaterial({
    color: 0xf1dfb2,
    roughness: 0.76,
    metalness: 0,
    depthTest: false,
    depthWrite: false
  });
  const flashlightMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c3133,
    roughness: 0.66,
    metalness: 0.2,
    depthTest: false,
    depthWrite: false
  });
  const lensMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd36a,
    emissive: 0xffba4a,
    emissiveIntensity: 0.35,
    roughness: 0.35,
    metalness: 0,
    depthTest: false,
    depthWrite: false
  });

  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.62, 0.28), sleeveMaterial);
  sleeve.position.set(0, 0.05, 0);
  sleeve.renderOrder = 20;
  group.add(sleeve);

  const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), cuffMaterial);
  cuff.position.set(0, -0.3, 0);
  cuff.renderOrder = 20;
  group.add(cuff);

  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.32), handMaterial);
  hand.position.set(0, -0.48, 0.04);
  hand.renderOrder = 20;
  group.add(hand);

  const flashlight = new THREE.Group();
  flashlight.visible = false;
  flashlight.position.set(0.03, -0.46, -0.18);
  flashlight.rotation.set(0.18, 0, 0);
  group.add(flashlight);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.36), flashlightMaterial);
  body.renderOrder = 21;
  flashlight.add(body);

  const lens = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.035), lensMaterial);
  lens.position.set(0, 0, -0.2);
  lens.renderOrder = 22;
  flashlight.add(lens);

  group.position.set(0.52, -0.46, -0.82);
  group.rotation.set(-0.42, -0.2, 0.16);
  return { group, flashlight };
}

function createBlockHighlight(): THREE.LineSegments {
  const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.015, 1.015, 1.015));
  const material = new THREE.LineBasicMaterial({
    color: 0xffe08a,
    transparent: true,
    opacity: 0.94,
    depthTest: false
  });
  const highlight = new THREE.LineSegments(geometry, material);
  highlight.visible = false;
  highlight.renderOrder = 30;
  return highlight;
}

function createCaveMonster(): CaveMonster {
  const group = new THREE.Group();
  group.visible = false;
  group.name = 'cave-stalker';

  const skin = new THREE.MeshStandardMaterial({ color: 0x1b1718, roughness: 0.96, metalness: 0 });
  const darkSkin = new THREE.MeshStandardMaterial({ color: 0x0b090a, roughness: 1, metalness: 0 });
  const mouth = new THREE.MeshStandardMaterial({
    color: 0x5b1218,
    roughness: 0.84,
    metalness: 0,
    emissive: 0x260106,
    emissiveIntensity: 0.55
  });
  const teeth = new THREE.MeshStandardMaterial({ color: 0xe7dcc5, roughness: 0.62, metalness: 0 });
  const eye = new THREE.MeshStandardMaterial({
    color: 0xffe1a2,
    roughness: 0.4,
    metalness: 0,
    emissive: 0xff5f32,
    emissiveIntensity: 1.8
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.45, 0.48), skin);
  body.position.y = 1.16;
  group.add(body);

  const head = new THREE.Group();
  head.position.set(0, 2.16, 0);
  group.add(head);

  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.42, 0.38), darkSkin);
  skull.position.z = -0.03;
  head.add(skull);

  const jawPetals: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i += 1) {
    const petal = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.54, 0.08), mouth);
    const angle = (i / 6) * Math.PI * 2;
    petal.position.set(Math.cos(angle) * 0.25, Math.sin(angle) * 0.25, 0.22);
    petal.rotation.set(0.72, 0, angle);
    head.add(petal);
    jawPetals.push(petal);
  }

  for (let i = 0; i < 10; i += 1) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 5), teeth);
    const angle = (i / 10) * Math.PI * 2;
    tooth.position.set(Math.cos(angle) * 0.19, Math.sin(angle) * 0.19, 0.34);
    tooth.rotation.set(Math.PI / 2, 0, -angle);
    head.add(tooth);
  }

  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.035), eye);
  leftEye.position.set(-0.13, 0.08, 0.22);
  head.add(leftEye);

  const rightEye = leftEye.clone();
  rightEye.position.x = 0.13;
  head.add(rightEye);

  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.08, 0.18), darkSkin);
  leftArm.position.set(-0.56, 1.08, 0);
  group.add(leftArm);

  const rightArm = leftArm.clone();
  rightArm.position.x = 0.56;
  group.add(rightArm);

  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.88, 0.2), darkSkin);
  leftLeg.position.set(-0.22, 0.38, 0);
  group.add(leftLeg);

  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.22;
  group.add(rightLeg);

  const light = new THREE.PointLight(0xff3a20, 0.95, 6, 2.1);
  light.position.set(0, 2.08, 0.18);
  group.add(light);

  return { group, head, jawPetals, leftArm, rightArm, leftLeg, rightLeg, light };
}

function animateCaveMonster(
  monster: CaveMonster,
  time: number,
  distance: number,
  state: MonsterAiState
): void {
  const run = Math.min(1.6, Math.max(0.65, distance / 7));
  const pace = state === 'attacking' ? 11.5 : 5.2;
  const step = Math.sin(time * pace) * 0.55 * run;
  monster.leftArm.rotation.x = step;
  monster.rightArm.rotation.x = -step;
  monster.leftLeg.rotation.x = -step * 0.72;
  monster.rightLeg.rotation.x = step * 0.72;
  monster.head.rotation.z = Math.sin(time * 4.8) * (state === 'attacking' ? 0.14 : 0.08);
  monster.light.intensity = (state === 'attacking' ? 1.1 : 0.38) + Math.sin(time * 18) * 0.18;

  for (let i = 0; i < monster.jawPetals.length; i += 1) {
    monster.jawPetals[i].rotation.x = (state === 'attacking' ? 0.96 : 0.58) + Math.sin(time * 8 + i) * 0.18;
  }
}

function createJumpscareImageDataUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 900;
  const context = canvas.getContext('2d')!;
  const center = canvas.width / 2;
  const gradient = context.createRadialGradient(center, center, 20, center, center, 520);
  gradient.addColorStop(0, '#5c0b12');
  gradient.addColorStop(0.36, '#150607');
  gradient.addColorStop(1, '#000000');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.translate(center, center);

  for (let i = 0; i < 7; i += 1) {
    const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
    context.save();
    context.rotate(angle);
    const petal = context.createLinearGradient(0, -48, 0, -360);
    petal.addColorStop(0, '#7a1119');
    petal.addColorStop(0.55, '#2a090d');
    petal.addColorStop(1, '#070304');
    context.fillStyle = petal;
    context.beginPath();
    context.moveTo(0, -38);
    context.quadraticCurveTo(112, -178, 42, -368);
    context.quadraticCurveTo(0, -430, -42, -368);
    context.quadraticCurveTo(-112, -178, 0, -38);
    context.fill();
    context.restore();
  }

  context.fillStyle = '#050101';
  context.beginPath();
  context.arc(0, 0, 168, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = '#d9cfb5';
  context.fillStyle = '#eadfc4';
  context.lineWidth = 5;
  for (let i = 0; i < 28; i += 1) {
    const angle = (i / 28) * Math.PI * 2;
    const inner = 120 + hash2(i, 3, TEXTURE_SEED) * 34;
    const outer = 210 + hash2(i, 9, TEXTURE_SEED) * 68;
    context.save();
    context.rotate(angle);
    context.beginPath();
    context.moveTo(0, -inner);
    context.lineTo(18, -outer);
    context.lineTo(-18, -outer);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }

  for (const eyeX of [-92, 92]) {
    const eyeGlow = context.createRadialGradient(eyeX, -52, 4, eyeX, -52, 44);
    eyeGlow.addColorStop(0, '#fff0b7');
    eyeGlow.addColorStop(0.35, '#ff5c28');
    eyeGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
    context.fillStyle = eyeGlow;
    context.beginPath();
    context.arc(eyeX, -52, 46, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
  return canvas.toDataURL('image/png');
}

function createVillageNpcs(world: VoxelWorld): {
  group: THREE.Group;
  reset: (world: VoxelWorld) => void;
  update: (delta: number, time: number, world: VoxelWorld) => void;
} {
  const group = new THREE.Group();
  const villagers: VillagerNpc[] = [];
  const materials = {
    robe: new THREE.MeshStandardMaterial({ color: 0x6d4b36, roughness: 0.86 }),
    robeDark: new THREE.MeshStandardMaterial({ color: 0x4b3326, roughness: 0.9 }),
    skin: new THREE.MeshStandardMaterial({ color: 0xb88962, roughness: 0.82 }),
    nose: new THREE.MeshStandardMaterial({ color: 0x9d6a4e, roughness: 0.82 }),
    belt: new THREE.MeshStandardMaterial({ color: 0x2f221c, roughness: 0.78 })
  };

  function reset(sourceWorld: VoxelWorld): void {
    group.clear();
    villagers.length = 0;
    const seed = sourceWorld.getSeed();

    for (const village of sourceWorld.getVillages()) {
      const configs = [
        { axis: 'x' as const, laneOffset: -4, phase: 0.2 },
        { axis: 'x' as const, laneOffset: 4, phase: 1.7 },
        { axis: 'z' as const, laneOffset: -4, phase: 2.8 },
        { axis: 'z' as const, laneOffset: 4, phase: 4.1 }
      ];

      configs.forEach((config, index) => {
        const npc = createVillagerNpc(
          village,
          config.axis,
          config.laneOffset,
          (hash2(village.x + index, village.z - index, seed + 503) - 0.5) * 16,
          hash2(village.x - index, village.z + index, seed + 607) > 0.5 ? 1 : -1,
          0.75 + hash2(village.x, village.z + index, seed + 709) * 0.45,
          config.phase,
          materials
        );
        villagers.push(npc);
        group.add(npc.root);
      });
    }

    update(0, 0, sourceWorld);
  }

  function update(delta: number, time: number, sourceWorld: VoxelWorld): void {
    for (const villager of villagers) {
      villager.routeOffset += villager.direction * villager.speed * delta;
      const limit = Math.max(5, villager.home.radius - 5);

      if (villager.routeOffset > limit) {
        villager.routeOffset = limit;
        villager.direction = -1;
      } else if (villager.routeOffset < -limit) {
        villager.routeOffset = -limit;
        villager.direction = 1;
      }

      const x = villager.home.x + (villager.axis === 'x' ? villager.routeOffset : villager.laneOffset);
      const z = villager.home.z + (villager.axis === 'z' ? villager.routeOffset : villager.laneOffset);
      const y = sourceWorld.getGroundSurfaceY(x, z);
      const forwardAngle = villager.axis === 'x'
        ? villager.direction > 0 ? Math.PI / 2 : -Math.PI / 2
        : villager.direction > 0 ? 0 : Math.PI;
      const step = Math.sin(time * 7.5 + villager.phase) * 0.42;

      villager.root.position.set(x, y, z);
      villager.root.rotation.y = forwardAngle;
      villager.root.position.y += Math.abs(Math.sin(time * 7.5 + villager.phase)) * 0.025;
      villager.leftArm.rotation.x = step;
      villager.rightArm.rotation.x = -step;
      villager.leftLeg.rotation.x = -step;
      villager.rightLeg.rotation.x = step;
    }
  }

  reset(world);
  return { group, reset, update };
}

function createVillagerNpc(
  home: VillageSite,
  axis: 'x' | 'z',
  laneOffset: number,
  routeOffset: number,
  direction: number,
  speed: number,
  phase: number,
  materials: {
    robe: THREE.Material;
    robeDark: THREE.Material;
    skin: THREE.Material;
    nose: THREE.Material;
    belt: THREE.Material;
  }
): VillagerNpc {
  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.78, 0.36), materials.robe);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.56), materials.skin);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.16), materials.nose);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.1, 0.39), materials.belt);
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.2), materials.robeDark);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.2), materials.robeDark);
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.48, 0.22), materials.robeDark);
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.48, 0.22), materials.robeDark);

  body.position.set(0, 0.92, 0);
  head.position.set(0, 1.54, -0.02);
  nose.position.set(0, 1.49, -0.36);
  belt.position.set(0, 0.78, -0.01);
  leftArm.position.set(-0.42, 0.92, 0);
  rightArm.position.set(0.42, 0.92, 0);
  leftLeg.position.set(-0.16, 0.28, 0);
  rightLeg.position.set(0.16, 0.28, 0);

  root.add(body, head, nose, belt, leftArm, rightArm, leftLeg, rightLeg);
  root.scale.setScalar(0.92);

  return {
    root,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    home,
    axis,
    laneOffset,
    routeOffset,
    direction,
    speed,
    phase
  };
}

function blockIntersectsPlayer(block: BlockPosition, playerPosition: THREE.Vector3): boolean {
  const playerMinX = playerPosition.x - PLAYER_RADIUS;
  const playerMaxX = playerPosition.x + PLAYER_RADIUS;
  const playerMinZ = playerPosition.z - PLAYER_RADIUS;
  const playerMaxZ = playerPosition.z + PLAYER_RADIUS;
  const playerMinY = playerPosition.y - PLAYER_EYE_HEIGHT;
  const playerMaxY = playerPosition.y + PLAYER_HEAD_CLEARANCE;

  return (
    block.x < playerMaxX &&
    block.x + 1 > playerMinX &&
    block.z < playerMaxZ &&
    block.z + 1 > playerMinZ &&
    block.y < playerMaxY &&
    block.y + 1 > playerMinY
  );
}

function isOreBlock(block: BlockId): block is OreBlockId {
  return oreBlockSet.has(block);
}

function getCaveFactor(world: VoxelWorld, playerPosition: THREE.Vector3): number {
  const x = Math.floor(playerPosition.x);
  const z = Math.floor(playerPosition.z);
  const eyeY = Math.floor(playerPosition.y);
  let cover = 0;

  for (let y = eyeY + 1; y < WORLD_HEIGHT; y += 1) {
    const block = world.getBlock(x, y, z);

    if (block && isCaveCoverBlock(block)) {
      cover += 1;

      if (cover >= 2) {
        break;
      }
    }
  }

  if (cover < 2) {
    return 0;
  }

  const surfaceY = world.getGroundSurfaceY(playerPosition.x, playerPosition.z);
  return clamp((surfaceY - playerPosition.y - 1.8) / 9, 0, 1);
}

function isCaveCoverBlock(block: BlockId): boolean {
  return block !== 'water' && block !== 'leaves' && block !== 'log' && block !== 'planks';
}

function resolveVerticalPlayerMove(
  world: VoxelWorld,
  playerPosition: THREE.Vector3,
  targetEyeY: number
): { y: number; grounded: boolean; blocked: boolean } {
  const startEyeY = playerPosition.y;

  if (Math.abs(targetEyeY - startEyeY) < COLLISION_EPSILON) {
    return { y: targetEyeY, grounded: false, blocked: false };
  }

  const candidate = playerPosition.clone();
  candidate.y = targetEyeY;

  if (!playerIntersectsSolid(world, candidate)) {
    return { y: targetEyeY, grounded: false, blocked: false };
  }

  if (targetEyeY < startEyeY) {
    const landingY = findLandingEyeY(world, playerPosition, startEyeY, targetEyeY);
    return {
      y: landingY ?? startEyeY,
      grounded: landingY !== null,
      blocked: true
    };
  }

  const ceilingY = findCeilingEyeY(world, playerPosition, startEyeY, targetEyeY);
  return {
    y: ceilingY ?? startEyeY,
    grounded: false,
    blocked: true
  };
}

function playerIntersectsSolid(world: VoxelWorld, playerPosition: THREE.Vector3): boolean {
  const bounds = getPlayerBlockBounds(playerPosition);

  for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
    for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
      for (let z = bounds.minZ; z <= bounds.maxZ; z += 1) {
        const block = world.getBlock(x, y, z);

        if (block && blockRegistry[block].solid) {
          return true;
        }
      }
    }
  }

  return false;
}

function playerIntersectsWater(world: VoxelWorld, playerPosition: THREE.Vector3): boolean {
  const bounds = getPlayerBlockBounds(playerPosition);

  for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
    for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
      for (let z = bounds.minZ; z <= bounds.maxZ; z += 1) {
        if (world.getBlock(x, y, z) === 'water') {
          return true;
        }
      }
    }
  }

  return false;
}

function playerHasGroundSupport(world: VoxelWorld, playerPosition: THREE.Vector3): boolean {
  const horizontalBounds = getPlayerHorizontalBlockBounds(playerPosition);
  const supportY = Math.floor(playerPosition.y - PLAYER_EYE_HEIGHT - COLLISION_EPSILON);

  for (let x = horizontalBounds.minX; x <= horizontalBounds.maxX; x += 1) {
    for (let z = horizontalBounds.minZ; z <= horizontalBounds.maxZ; z += 1) {
      const block = world.getBlock(x, supportY, z);

      if (block && blockRegistry[block].solid) {
        return true;
      }
    }
  }

  return false;
}

function placementWouldTrapPlayer(
  world: VoxelWorld,
  block: BlockPosition,
  blockId: BlockId,
  playerPosition: THREE.Vector3
): boolean {
  if (!blockRegistry[blockId].solid) {
    return false;
  }

  const escapeOffsets = [
    [PLAYER_ESCAPE_TEST_DISTANCE, 0],
    [-PLAYER_ESCAPE_TEST_DISTANCE, 0],
    [0, PLAYER_ESCAPE_TEST_DISTANCE],
    [0, -PLAYER_ESCAPE_TEST_DISTANCE]
  ] as const;

  return escapeOffsets.every(([offsetX, offsetZ]) => {
    const escapePosition = new THREE.Vector3(
      playerPosition.x + offsetX,
      playerPosition.y,
      playerPosition.z + offsetZ
    );

    return playerIntersectsSolidOrPlacedBlock(world, escapePosition, block);
  });
}

function playerIntersectsSolidOrPlacedBlock(
  world: VoxelWorld,
  playerPosition: THREE.Vector3,
  placedBlock: BlockPosition
): boolean {
  const bounds = getPlayerBlockBounds(playerPosition);

  if (blockPositionIntersectsBounds(placedBlock, bounds)) {
    return true;
  }

  for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
    for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
      for (let z = bounds.minZ; z <= bounds.maxZ; z += 1) {
        const block = world.getBlock(x, y, z);

        if (block && blockRegistry[block].solid) {
          return true;
        }
      }
    }
  }

  return false;
}

function findLandingEyeY(
  world: VoxelWorld,
  playerPosition: THREE.Vector3,
  fromEyeY: number,
  toEyeY: number
): number | null {
  const horizontalBounds = getPlayerHorizontalBlockBounds(playerPosition);
  const fromFootY = fromEyeY - PLAYER_EYE_HEIGHT;
  const toFootY = toEyeY - PLAYER_EYE_HEIGHT;
  const minY = Math.floor(toFootY - COLLISION_EPSILON);
  const maxY = Math.floor(fromFootY + COLLISION_EPSILON);
  let landingFootY: number | null = null;

  for (let x = horizontalBounds.minX; x <= horizontalBounds.maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      for (let z = horizontalBounds.minZ; z <= horizontalBounds.maxZ; z += 1) {
        const block = world.getBlock(x, y, z);
        const blockTopY = y + 1;

        if (
          block &&
          blockRegistry[block].solid &&
          blockTopY <= fromFootY + COLLISION_EPSILON &&
          blockTopY >= toFootY - COLLISION_EPSILON
        ) {
          landingFootY = Math.max(landingFootY ?? blockTopY, blockTopY);
        }
      }
    }
  }

  return landingFootY === null ? null : landingFootY + PLAYER_EYE_HEIGHT;
}

function findCeilingEyeY(
  world: VoxelWorld,
  playerPosition: THREE.Vector3,
  fromEyeY: number,
  toEyeY: number
): number | null {
  const horizontalBounds = getPlayerHorizontalBlockBounds(playerPosition);
  const fromHeadY = fromEyeY + PLAYER_HEAD_CLEARANCE;
  const toHeadY = toEyeY + PLAYER_HEAD_CLEARANCE;
  const minY = Math.floor(fromHeadY - COLLISION_EPSILON);
  const maxY = Math.floor(toHeadY + COLLISION_EPSILON);
  let ceilingY: number | null = null;

  for (let x = horizontalBounds.minX; x <= horizontalBounds.maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      for (let z = horizontalBounds.minZ; z <= horizontalBounds.maxZ; z += 1) {
        const block = world.getBlock(x, y, z);

        if (
          block &&
          blockRegistry[block].solid &&
          y >= fromHeadY - COLLISION_EPSILON &&
          y <= toHeadY + COLLISION_EPSILON
        ) {
          ceilingY = Math.min(ceilingY ?? y, y);
        }
      }
    }
  }

  return ceilingY === null ? null : ceilingY - PLAYER_HEAD_CLEARANCE - COLLISION_EPSILON;
}

function getPlayerBlockBounds(playerPosition: THREE.Vector3): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
} {
  const horizontalBounds = getPlayerHorizontalBlockBounds(playerPosition);

  return {
    ...horizontalBounds,
    minY: Math.floor(playerPosition.y - PLAYER_EYE_HEIGHT + COLLISION_EPSILON),
    maxY: Math.floor(playerPosition.y + PLAYER_HEAD_CLEARANCE - COLLISION_EPSILON)
  };
}

function getPlayerHorizontalBlockBounds(playerPosition: THREE.Vector3): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
} {
  return {
    minX: Math.floor(playerPosition.x - PLAYER_RADIUS + COLLISION_EPSILON),
    maxX: Math.floor(playerPosition.x + PLAYER_RADIUS - COLLISION_EPSILON),
    minZ: Math.floor(playerPosition.z - PLAYER_RADIUS + COLLISION_EPSILON),
    maxZ: Math.floor(playerPosition.z + PLAYER_RADIUS - COLLISION_EPSILON)
  };
}

function blockPositionIntersectsBounds(
  block: BlockPosition,
  bounds: ReturnType<typeof getPlayerBlockBounds>
): boolean {
  return (
    block.x >= bounds.minX &&
    block.x <= bounds.maxX &&
    block.y >= bounds.minY &&
    block.y <= bounds.maxY &&
    block.z >= bounds.minZ &&
    block.z <= bounds.maxZ
  );
}

function requestPointerLock(element: HTMLElement): void {
  try {
    void Promise.resolve(element.requestPointerLock()).catch(() => undefined);
  } catch {
    // Browsers may reject pointer lock in automated or embedded previews.
  }
}

function intBound(origin: number, direction: number): number {
  if (direction > 0) {
    return (Math.floor(origin + 1) - origin) / direction;
  }

  if (direction < 0) {
    return (origin - Math.floor(origin)) / -direction;
  }

  return Number.POSITIVE_INFINITY;
}

function chunkCoord(value: number): number {
  return Math.floor(value / CHUNK_SIZE);
}

function localChunkBlockCoord(value: number): number {
  return ((value % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
}

function fbm(x: number, z: number, octaves: number, seed: number): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;

  for (let i = 0; i < octaves; i += 1) {
    value += valueNoise(x * frequency, z * frequency, seed + i * 101) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / total;
}

function valueNoise(x: number, z: number, seed: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const x1 = x0 + 1;
  const z1 = z0 + 1;
  const tx = smooth01(x - x0);
  const tz = smooth01(z - z0);

  const a = hash2(x0, z0, seed);
  const b = hash2(x1, z0, seed);
  const c = hash2(x0, z1, seed);
  const d = hash2(x1, z1, seed);

  return lerp(lerp(a, b, tx), lerp(c, d, tx), tz);
}

function fbm3(x: number, y: number, z: number, octaves: number, seed: number): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;

  for (let i = 0; i < octaves; i += 1) {
    value += valueNoise3(x * frequency, y * frequency, z * frequency, seed + i * 131) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / total;
}

function valueNoise3(x: number, y: number, z: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const z1 = z0 + 1;
  const tx = smooth01(x - x0);
  const ty = smooth01(y - y0);
  const tz = smooth01(z - z0);

  const c000 = hash3(x0, y0, z0, seed);
  const c100 = hash3(x1, y0, z0, seed);
  const c010 = hash3(x0, y1, z0, seed);
  const c110 = hash3(x1, y1, z0, seed);
  const c001 = hash3(x0, y0, z1, seed);
  const c101 = hash3(x1, y0, z1, seed);
  const c011 = hash3(x0, y1, z1, seed);
  const c111 = hash3(x1, y1, z1, seed);

  const x00 = lerp(c000, c100, tx);
  const x10 = lerp(c010, c110, tx);
  const x01 = lerp(c001, c101, tx);
  const x11 = lerp(c011, c111, tx);

  return lerp(lerp(x00, x10, ty), lerp(x01, x11, ty), tz);
}

function hash2(x: number, z: number, seed: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ Math.imul(seed, 1442695041);
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function hash3(x: number, y: number, z: number, seed: number): number {
  let h =
    Math.imul(x, 374761393) ^
    Math.imul(y, 1442695041) ^
    Math.imul(z, 668265263) ^
    Math.imul(seed, 1274126177);
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 2246822519) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function createWorldSeed(): number {
  const values = new Uint32Array(1);
  globalThis.crypto?.getRandomValues(values);
  return (values[0] || Math.floor(Math.random() * 0xfffffff)) + 1;
}

function mountain(
  x: number,
  z: number,
  centerX: number,
  centerZ: number,
  radius: number,
  height: number
): number {
  const dx = x - centerX;
  const dz = z - centerZ;
  const distance = Math.sqrt(dx * dx + dz * dz);
  const falloff = clamp(1 - distance / radius, 0, 1);
  return smooth01(falloff) * height;
}

function smooth01(value: number): number {
  return value * value * (3 - 2 * value);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function approach(current: number, target: number, maxDelta: number): number {
  if (current < target) {
    return Math.min(current + maxDelta, target);
  }

  if (current > target) {
    return Math.max(current - maxDelta, target);
  }

  return target;
}

void main().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<pre style="padding: 24px; color: #f7f0df; background: #171818; min-height: 100vh; margin: 0; white-space: pre-wrap;">${String(error)}</pre>`;
});
