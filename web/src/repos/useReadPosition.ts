import { HTTPError } from 'ky';

import { UserSettingApi } from '@/api';
import { GenericNovelId } from '@/model/Common';
import { safeJson } from '@/util';

interface ReadPosition {
  chapterId: string;
  scrollY: number;
}

type ReaderPositions = Record<string, ReadPosition | undefined>;

const key = 'readPosition';

const storage = {
  get: () => {
    const text = window.localStorage.getItem(key) ?? '';
    const value = safeJson<ReaderPositions>(text) ?? {};
    return value;
  },
  set: (value: ReaderPositions) => {
    const text = JSON.stringify(value);
    window.localStorage.setItem(key, text);
  },
};

let positionsCache = storage.get();
let hydrated = false;
let dirtyBeforeHydrated = false;
let hydratePromise: Promise<void> | undefined;

const saveRemote = async () => {
  try {
    await UserSettingApi.updateSetting(key, JSON.stringify(positionsCache));
  } catch (e) {
    if (e instanceof HTTPError && e.response.status === 401) {
      return;
    }
    console.error('同步阅读位置失败', e);
  }
};

const hydrate = async () => {
  try {
    const remoteValue = await UserSettingApi.getSetting(key);
    if (remoteValue !== undefined && !dirtyBeforeHydrated) {
      positionsCache = safeJson<ReaderPositions>(remoteValue) ?? positionsCache;
      storage.set(positionsCache);
    } else if (remoteValue === undefined) {
      await saveRemote();
    }
  } catch (e) {
    if (e instanceof HTTPError && e.response.status === 401) {
      return;
    }
    console.error('读取服务器阅读位置失败', e);
  } finally {
    hydrated = true;
    if (dirtyBeforeHydrated) {
      dirtyBeforeHydrated = false;
      await saveRemote();
    }
  }
};

const ready = () => {
  hydratePromise ??= hydrate();
  return hydratePromise;
};

const addPosition = (gnid: GenericNovelId, position: ReadPosition) => {
  if (position.scrollY === 0) {
    delete positionsCache[GenericNovelId.toString(gnid)];
  } else {
    positionsCache[GenericNovelId.toString(gnid)] = position;
  }
  storage.set(positionsCache);
  if (hydrated) {
    void saveRemote();
  } else {
    dirtyBeforeHydrated = true;
    void ready();
  }
};

const getPosition = (gnid: GenericNovelId) => {
  void ready();
  return positionsCache[GenericNovelId.toString(gnid)];
};

export const ReadPositionRepo = {
  addPosition,
  getPosition,
  ready,
};
