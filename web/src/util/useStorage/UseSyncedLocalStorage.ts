import { HTTPError } from 'ky';
import { pausableWatch } from '@vueuse/core';
import { nextTick, ref, type Ref } from 'vue';

import { UserSettingApi } from '@/api';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function useSyncedLocalStorage<T extends object>(
  key: string,
  defaults: T,
  migrate?: (value: T) => void,
) {
  const data = ref<T>(clone(defaults)) as Ref<T>;
  migrate?.(data.value);

  let hydrated = false;
  let dirtyBeforeHydrated = false;

  const { pause, resume } = pausableWatch(
    data,
    () => {
      if (!hydrated) {
        dirtyBeforeHydrated = true;
        return;
      }
      void save();
    },
    { deep: true },
  );

  const save = async () => {
    try {
      await UserSettingApi.updateSetting(key, JSON.stringify(data.value));
    } catch (e) {
      if (e instanceof HTTPError && e.response.status === 401) {
        return;
      }
      console.error(`同步设置失败:${key}`, e);
    }
  };

  const hydrate = async () => {
    try {
      const remoteValue = await UserSettingApi.getSetting(key);
      if (remoteValue !== undefined && !dirtyBeforeHydrated) {
        const parsed = JSON.parse(remoteValue);
        pause();
        data.value = Array.isArray(parsed)
          ? parsed
          : { ...clone(defaults), ...parsed };
        migrate?.(data.value);
        void nextTick(resume);
      } else if (remoteValue === undefined) {
        await save();
      }
    } catch (e) {
      if (e instanceof HTTPError && e.response.status === 401) {
        return;
      }
      console.error(`读取服务器设置失败:${key}`, e);
    } finally {
      hydrated = true;
      if (dirtyBeforeHydrated) {
        dirtyBeforeHydrated = false;
        await save();
      }
    }
  };

  void hydrate();

  return data;
}
