export default class ServiceContainer {
  /** Map containing the services */
  protected services: Map<string, Function>;

  constructor() {
    this.services = new Map();
  }

  public set(name: string, service: any, ...params: any) {
    if (typeof this.services.get(name) === 'function') {
      throw new Error(`Key ${name} already exists in the service container.`);
    }
    this.services.set(name, function lazyBuilder() {
      // todo: it would be nice to optionally provide a singleton
      if (typeof lazyBuilder.instance === 'undefined') {
        lazyBuilder.instance = new service(...params);
      }
      return lazyBuilder.instance;
    });
  }

  public get(name: string) {
    const callback = this.services.get(name);
    if (typeof callback === 'undefined') {
      throw new Error(`Key ${name} does not exist.`);
    }
    if (typeof callback !== 'function') {
      throw new Error(`Key ${name} does is not mapped to a function.`);
    }
    return callback();
  }
}
