'use strict';

function getType(value) {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (value === null) {
    return 'null';
  }
  return typeof value;
}

function allowsType(schemaType, actualType) {
  const types = Array.isArray(schemaType) ? schemaType : [schemaType];
  return types.includes(actualType) || (actualType === 'integer' && types.includes('number'));
}

function validateJsonSchema(schema, value, path = 'value') {
  if (!schema) {
    return [];
  }

  const errors = [];
  const actualType = Number.isInteger(value) ? 'integer' : getType(value);

  if (schema.type && !allowsType(schema.type, actualType)) {
    errors.push(`${path} must be ${Array.isArray(schema.type) ? schema.type.join(' or ') : schema.type}`);
    return errors;
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path} must be one of ${schema.enum.map((item) => JSON.stringify(item)).join(', ')}`);
  }

  if (schema.type === 'object' || (schema.properties && value !== null && typeof value === 'object' && !Array.isArray(value))) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`${path} must be object`);
      return errors;
    }

    const required = schema.required ?? [];
    for (const key of required) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(`${path}.${key} is required`);
      }
    }

    const properties = schema.properties ?? {};
    for (const [key, nestedSchema] of Object.entries(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(...validateJsonSchema(nestedSchema, value[key], `${path}.${key}`));
      }
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) {
          errors.push(`${path}.${key} is not allowed`);
        }
      }
    }
  }

  if (schema.type === 'array' || (schema.items && Array.isArray(value))) {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be array`);
      return errors;
    }
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${path} must contain at least ${schema.minItems} items`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${path} must contain at most ${schema.maxItems} items`);
    }
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateJsonSchema(schema.items, item, `${path}[${index}]`));
      });
    }
  }

  return errors;
}

module.exports = {
  validateJsonSchema,
};
