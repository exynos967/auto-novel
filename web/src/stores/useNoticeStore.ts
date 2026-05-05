import { useSyncedLocalStorage } from '@/util/useStorage/UseSyncedLocalStorage';
import { LSKey } from './key';

interface Noticed {
  wenkuUploadRule: number;
}

export const useNoticeStore = defineStore(LSKey.Notified, () => {
  const noticed = useSyncedLocalStorage<Noticed>(LSKey.Notified, {
    wenkuUploadRule: 0,
  });
  return {
    noticed,
  };
});
