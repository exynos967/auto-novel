import { HTTPError } from 'ky';

import { client } from './client';

const getSetting = async (key: string) => {
  try {
    return await client.get(`user/setting/${key}`).text();
  } catch (e) {
    if (e instanceof HTTPError && e.response.status === 404) {
      return undefined;
    }
    throw e;
  }
};

const updateSetting = (key: string, value: string) =>
  client.put(`user/setting/${key}`, { json: { value } });

export const UserSettingApi = {
  getSetting,
  updateSetting,
};
