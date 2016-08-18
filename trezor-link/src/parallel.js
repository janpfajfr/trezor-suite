/* @flow */

import type {Transport, AcquireInput, TrezorDeviceInfoWithSession, MessageFromTrezor} from './transport';

export class ParallelTransport {

  transports: {[key: string]: Transport};

  constructor(transports: {[key: string]: Transport}) {
    this.transports = transports;
  }

  _prepend(name: string, devices: Array<TrezorDeviceInfoWithSession>): Array<TrezorDeviceInfoWithSession> {
    return devices.map(device => {
      return {
        path: `${name}-${device.path}`,
        session: device.session == null ? null : `${name}-${device.session}`,
      };
    });
  }

  _filter(name: string, devices: Array<TrezorDeviceInfoWithSession>): Array<TrezorDeviceInfoWithSession> {
    return devices.filter(device => this._parseName(device.path).name === name).map(device => {
      return {
        ...device,
        path: this._parseName(device.path).rest,
        session: device.session == null ? device.session : this._parseName(device.session).rest,
      };
    });
  }

  async enumerate(): Promise<Array<TrezorDeviceInfoWithSession>> {
    const res = [];
    // eslint-disable-next-line prefer-const
    for (let name of Object.keys(this.transports)) {
      const devices = await this.transports[name].enumerate();
      res.push(...(this._prepend(name, devices)));
    }
    return res;
  }

  async listen(old: ?Array<TrezorDeviceInfoWithSession>): Promise<Array<TrezorDeviceInfoWithSession>> {
    const res = [];
    // eslint-disable-next-line prefer-const
    for (let name of Object.keys(this.transports)) {
      const oldFiltered = old == null ? null : this._filter(name, old);
      const devices = await this.transports[name].listen(oldFiltered);
      res.push(...(this._prepend(name, devices)));
    }
    return res;
  }

  _parseName(input: string): {
    transport: Transport,
    name: string,
    rest: string
  } {
    if (input == null) {
      throw new Error(`Wrong input`);
    }

    const [name, ...restArray] = input.split(`-`);
    if (restArray.length === 0) {
      throw new Error(`Input has to contain transport name.`);
    }
    const transport: Transport = this.transports[name];
    if (transport == null) {
      throw new Error(`Input has to contain valid transport name.`);
    }
    const rest = restArray.join(`-`);

    return {
      transport,
      name,
      rest,
    };
  }

  async acquire(input: AcquireInput): Promise<string> {
    const path = this._parseName(input.path);
    const previous = input.previous == null ? null : this._parseName(input.previous);
    if (previous != null && path.name !== previous.name) {
      throw new Error(`Session transport has to equal path transport.`);
    }
    const newInput: AcquireInput = {
      path: path.rest,
      previous: previous == null ? null : previous.rest,
      checkPrevious: input.checkPrevious,
    };
    const res = await path.transport.acquire(newInput);
    return `${path.name}-${res}`;
  }

  async release(session: string): Promise<void> {
    const sessionP = this._parseName(session);
    return sessionP.transport.release(sessionP.rest);
  }

  _checkConfigured(): boolean {
    // configured is true if all of the transports are configured
    for (const name of Object.keys(this.transports)) {
      const transport = this.transports[name];
      if (!transport.configured) {
        return false;
      }
    }
    return true;
  }

  async configure(signedData: string): Promise<void> {
    // eslint-disable-next-line prefer-const
    for (let name of Object.keys(this.transports)) {
      const transport = this.transports[name];
      await transport.configure(signedData);
    }
    this.configured = this._checkConfigured();
  }

  async call(session: string, name: string, data: Object): Promise<MessageFromTrezor> {
    const sessionP = this._parseName(session);
    return sessionP.transport.call(sessionP.rest, name, data);
  }

  // resolves when the transport can be used; rejects when it cannot
  async init(): Promise<void> {
    let version = ``;
    // eslint-disable-next-line prefer-const
    for (let name of Object.keys(this.transports)) {
      const transport = this.transports[name];
      await transport.init();
      version = version + `${name}:${transport.version};`;
    }
    this.version = version;
    this.configured = this._checkConfigured();
  }

  configured: boolean;

  version: string;
}
