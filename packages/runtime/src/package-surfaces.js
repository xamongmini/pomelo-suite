'use strict';

const path = require('node:path');

function requirePackageOrWorkspace(packageName, workspacePackageName) {
  try {
    return require(packageName);
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND' || !error.message.includes(packageName)) {
      throw error;
    }
    return require(path.join(__dirname, '..', '..', workspacePackageName, 'src'));
  }
}

module.exports = {
  calculator: requirePackageOrWorkspace('@pomelo-suite/calculator', 'calculator'),
  scheduler: requirePackageOrWorkspace('@pomelo-suite/scheduler', 'scheduler'),
  workqueue: requirePackageOrWorkspace('@pomelo-suite/workqueue', 'workqueue'),
};
