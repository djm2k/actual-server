import { ServerOptions } from 'https';

export interface Config {
  mode: 'test' | 'development';
  loginMethod: 'password' | 'header';
  trustedProxies: string[] | number | boolean;
  dataDir: string;
  projectRoot: string;
  port: number;
  hostname: string;
  serverFiles: string;
  userFiles: string;
  webRoot: string;
  https?: {
    key: string;
    cert: string;
  } & ServerOptions;
  upload?: {
    fileSizeSyncLimitMB: number;
    syncEncryptedFileSizeLimitMB: number;
    fileSizeLimitMB: number;
  };
}
