/* @flow */

// $FlowIssue
// eslint-disable-next-line no-undef
onconnect = function (e) {
  const port = e.ports[0];
  port.onmessage = function (e) {
    handleMessage(e.data, port);
  };
};

import {create as createDefered} from '../defered';
import type {Defered} from '../defered';

import type {MessageFromSharedWorker, MessageToSharedWorker} from './withSharedConnections';
import type {TrezorDeviceInfo} from '../transport';

// path => session
const state: {[path: string]: string} = {};

let lock: ?Defered<Object> = null;
let waitPromise: Promise<void> = Promise.resolve();

type PortObject = {postMessage: (message: Object) => void};

function startLock(ms: number): void {
  const newLock = createDefered();
  lock = newLock;
  setTimeout(() => newLock.reject(new Error(`Timed out`)), ms);
}

function releaseLock(obj: Object): void {
  if (lock == null) {
    // TODO: ???
    return;
  }
  lock.resolve(obj);
}

function waitForLock(): Promise<any> {
  if (lock == null) {
    // TODO: ???
    return Promise.reject(new Error(`???`));
  }
  return lock.promise;
}

function waitInQueue(fn: () => Promise<void>) {
  const res = waitPromise.then(() => fn());
  waitPromise = res.catch(() => {});
}

function handleMessage({id, message}: {id: number, message: MessageToSharedWorker}, port: PortObject) {
  if (message.type === `acquire-intent`) {
    const path: string = message.path;
    const checkPrevious: boolean = message.checkPrevious;
    const previous: ?string = message.previous;
    waitInQueue(() => handleAcquireIntent(path, checkPrevious, previous, id, port));
  }
  if (message.type === `acquire-done`) {
    handleAcquireDone(id); // port is the same as original
  }
  if (message.type === `acquire-failed`) {
    handleAcquireFailed(id); // port is the same as original
  }
  if (message.type === `get-sessions`) {
    waitInQueue(() => handleGetSessions(id, port));
  }

  if (message.type === `get-sessions-and-disconnect`) {
    const devices = message.devices;
    waitInQueue(() => handleGetSessions(id, port, devices));
  }

  if (message.type === `release-intent`) {
    const session: string = message.session;
    waitInQueue(() => handleReleaseIntent(session, id, port));
  }
  if (message.type === `release-done`) {
    handleReleaseDone(id); // port is the same as original
  }

  if (message.type === `call-intent`) {
    const session: string = message.session;
    waitInQueue(() => handleCallIntent(session, id, port));
  }
  if (message.type === `call-done`) {
    handleCallDone(id); // port is the same as original
  }
}

function handleReleaseDone(
  id: number
) {
  releaseLock({id});
}

function handleCallDone(
  id: number
) {
  releaseLock({id});
}

function handleCallIntent(
    session: string,
    id: number,
    port: PortObject
): Promise<void> {
  let path_: ?string = null;
  Object.keys(state).forEach(kpath => {
    if (state[kpath] === session) {
      path_ = kpath;
    }
  });
  if (path_ == null) {
    sendBack({type: `wrong-session`}, id, port);
    return Promise.resolve();
  }

  const path: string = path_;

  startLock(10 * 10 * 1000);
  sendBack({type: `path`, path}, id, port);

  return waitForLock().then((obj: {id: number}) => {
    sendBack({type: `ok`}, obj.id, port);
  });
}

function handleReleaseIntent(
    session: string,
    id: number,
    port: PortObject
): Promise<void> {
  let path_: ?string = null;
  Object.keys(state).forEach(kpath => {
    if (state[kpath] === session) {
      path_ = kpath;
    }
  });
  if (path_ == null) {
    sendBack({type: `double-release`}, id, port);
    return Promise.resolve();
  }

  const path: string = path_;

  startLock(10 * 1000);
  sendBack({type: `path`, path}, id, port);

  // if lock times out, promise rejects and queue goes on
  return waitForLock().then((obj: {id: number}) => {
    // failure => nothing happens, but still has to reply "ok"
    delete state[path];
    sendBack({type: `ok`}, obj.id, port);
  });
}

function handleGetSessions(
  id: number,
  port: PortObject,
  devices: ?Array<TrezorDeviceInfo>
): Promise<void> {
  if (devices != null) {
    const connected: {[path: string]: boolean} = {};
    devices.forEach(d => { connected[d.path] = true; });
    Object.keys(state).forEach(path => {
      if (!connected[path]) {
        delete state[path];
      }
    });
  }
  sendBack({type: `sessions`, sessions: state}, id, port);
  return Promise.resolve();
}

let lastSession = 0;
function handleAcquireDone(
  id: number
) {
  releaseLock({good: true, id});
}

function handleAcquireFailed(
  id: number
) {
  releaseLock({good: false, id});
}

function handleAcquireIntent(
    path: string,
    checkPrevious: boolean,
    previous: ?string,
    id: number,
    port: PortObject
): Promise<void> {
  let error = false;
  if (checkPrevious) {
    const realPrevious = state[path];

    if (realPrevious == null) {
      error = (previous != null);
    } else {
      error = (previous !== realPrevious);
    }
  }
  if (error) {
    sendBack({type: `wrong-previous-session`}, id, port);
    return Promise.resolve();
  } else {
    startLock(10 * 1000);
    sendBack({type: `ok`}, id, port);
    // if lock times out, promise rejects and queue goes on
    return waitForLock().then((obj: {good: boolean, id: number}) => {
      if (obj.good) {
        lastSession++;
        const session = lastSession.toString();
        state[path] = session;
        sendBack({type: `session-number`, number: session}, obj.id, port);
      } else {
        // failure => nothing happens, but still has to reply "ok"
        sendBack({type: `ok`}, obj.id, port);
      }
    });
  }
}

function sendBack(message: MessageFromSharedWorker, id: number, port: PortObject) {
  port.postMessage({id, message});
}

