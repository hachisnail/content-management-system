import { EventEmitter } from 'events';

class AppEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
  }
}

export const appEvents = new AppEmitter();

export const EVENTS = {
  DB_CREATE: 'db:create',
  DB_UPDATE: 'db:update',
  DB_DELETE: 'db:delete',
  SESSION_TERMINATED: 'auth:session_terminated'
};