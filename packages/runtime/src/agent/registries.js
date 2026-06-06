'use strict';

const { validateJsonSchema } = require('./schema-validator');

class PermissionPolicy {
  constructor({ allowedPermissions = [], allow = null } = {}) {
    this.allowedPermissions = new Set(allowedPermissions);
    this.allow = allow;
  }

  canRun(context) {
    if (typeof this.allow === 'function') {
      return Boolean(this.allow(context));
    }
    const permissions = context.permissions ?? [];
    return permissions.every((permission) => this.allowedPermissions.has(permission));
  }
}

class AgentRegistry {
  constructor({ kind, permissionPolicy = null } = {}) {
    this.kind = kind;
    this.permissionPolicy = permissionPolicy;
    this.entries = new Map();
  }

  register(nameOrDescriptor, handler = null, options = {}) {
    const descriptor = typeof nameOrDescriptor === 'string'
      ? { ...options, name: nameOrDescriptor, handler }
      : { ...nameOrDescriptor };

    if (!descriptor.name) {
      throw new TypeError(`${this.kind} name is required`);
    }
    if (typeof descriptor.handler !== 'function') {
      throw new TypeError(`${this.kind} '${descriptor.name}' handler must be a function`);
    }

    descriptor.permissions = Array.from(descriptor.permissions ?? []);
    this.entries.set(String(descriptor.name), descriptor);
    return this;
  }

  get(name) {
    return this.entries.get(String(name)) ?? null;
  }

  has(name) {
    return this.entries.has(String(name));
  }

  list() {
    return [...this.entries.values()].map((descriptor) => ({ ...descriptor, handler: undefined }));
  }

  async execute(name, input = {}, context = {}) {
    const descriptor = this.get(name);
    if (!descriptor) {
      throw new Error(`Unknown ${this.kind} '${name}'`);
    }

    const errors = validateJsonSchema(descriptor.inputSchema, input, 'input');
    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    const permissions = descriptor.permissions ?? [];
    if (permissions.length > 0) {
      const policy = context.permissionPolicy ?? this.permissionPolicy;
      const permissionContext = {
        ...context,
        descriptor,
        input,
        kind: this.kind,
        name: descriptor.name,
        permissions,
      };
      const allowed = typeof policy === 'function'
        ? Boolean(policy(permissionContext))
        : Boolean(policy?.canRun?.(permissionContext));
      if (!allowed) {
        throw new Error(`Permission denied for ${this.kind} '${descriptor.name}'`);
      }
    }

    return descriptor.handler({
      context,
      descriptor,
      input,
    });
  }
}

class ToolRegistry extends AgentRegistry {
  constructor(options = {}) {
    super({ ...options, kind: 'tool' });
  }
}

class SkillRegistry extends AgentRegistry {
  constructor(options = {}) {
    super({ ...options, kind: 'skill' });
  }
}

module.exports = {
  AgentRegistry,
  PermissionPolicy,
  SkillRegistry,
  ToolRegistry,
};
