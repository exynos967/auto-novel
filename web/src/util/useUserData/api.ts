import ky from 'ky';

const AUTH_MODES = ['remote'] as const;

export const isAuthEnabled = (): boolean =>
  AUTH_MODES.some((mode) => mode === import.meta.env.VITE_API_MODE);

export const AuthUrl = (() => {
  if (!isAuthEnabled()) {
    return window.location.origin;
  }

  const { protocol, hostname } = window.location;

  // 让 kuriko 的开发环境可以跑起来，后续需要支持开发环境免登录
  if (hostname === 'localhost') {
    return `${protocol}//localhost:8000`;
  }

  // 不考虑 a.co.uk 这种顶级域名
  //  n.novelia.cc => auth.novelia.cc
  //  test.com => auth.test.com
  const parts = hostname.split('.');
  const baseDomain = parts.length > 2 ? parts.slice(-2).join('.') : hostname;
  return `${protocol}//auth.${baseDomain}`;
})();

const client = ky.create({
  prefixUrl: AuthUrl + '/api/v1',
  credentials: 'include',
});

export const AuthApi = {
  refresh: (app: string) =>
    client.post(`auth/refresh`, { searchParams: { app } }).text(),
  logout: () => client.post(`auth/logout`).text(),
};
