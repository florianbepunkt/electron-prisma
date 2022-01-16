// import { ApiSurface } from './os/api';
// export type ApiSurface = typeof api;
import { api } from '../main/preload';

type ApiSurface = typeof api;

declare global {
  interface Window {
    electron: ApiSurface;
  }
}
