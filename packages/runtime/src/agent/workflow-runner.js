'use strict';

const { workqueue } = require('../package-surfaces');

const { WorkItem, WorkQueue } = workqueue;

class AgentWorkflowWorkItem extends WorkItem {
  constructor({ runner, workflowName, parameter = null } = {}) {
    super();
    if (!runner || typeof runner.runWorkflow !== 'function') {
      throw new TypeError('runner with runWorkflow() is required');
    }
    if (!workflowName) {
      throw new TypeError('workflowName is required');
    }
    this.runner = runner;
    this.workflowName = workflowName;
    this.parameter = parameter;
    this.result = null;
  }

  async perform() {
    this.result = await this.runner.runWorkflow(this.workflowName, this.parameter);
    return this.result;
  }
}

class AgentWorkflowRunner {
  constructor({ runtime, workQueue = null, scheduler = null } = {}) {
    if (!runtime || typeof runtime.loadTumbler !== 'function') {
      throw new TypeError('runtime with loadTumbler() is required');
    }
    this.runtime = runtime;
    this.workQueue = workQueue ?? new WorkQueue({ concurrentLimit: 1 });
    this.scheduler = scheduler;
    this.workflows = new Map();
    this.completedRuns = [];
  }

  registerWorkflow(name, bean) {
    if (!name) {
      throw new TypeError('workflow name is required');
    }
    if (!bean) {
      throw new TypeError('workflow bean is required');
    }
    this.workflows.set(String(name), bean);
    return this;
  }

  getWorkflow(name) {
    return this.workflows.get(String(name)) ?? null;
  }

  async runWorkflow(name, parameter = null) {
    const workflowName = String(name);
    const bean = this.getWorkflow(workflowName);
    if (!bean) {
      throw new Error(`Unknown workflow '${workflowName}'`);
    }

    const controller = this.runtime.loadTumbler(workflowName, bean, parameter);
    const output = controller.execute();
    if (output && typeof output.then === 'function') {
      await output;
    }

    const result = {
      controller,
      processes: controller.Return.process,
      returnValue: controller.Return,
      workflowName,
    };
    this.completedRuns.push(result);
    return result;
  }

  createWorkItem(name, parameter = null) {
    return new AgentWorkflowWorkItem({
      parameter,
      runner: this,
      workflowName: name,
    });
  }

  enqueueWorkflow(name, parameter = null, workQueue = this.workQueue) {
    if (!workQueue || typeof workQueue.add !== 'function') {
      throw new TypeError('workQueue with add() is required');
    }
    const item = this.createWorkItem(name, parameter);
    workQueue.add(item);
    return item;
  }

  scheduleWorkflow(schedule, name, parameter = null, { scheduler = this.scheduler, workQueue = this.workQueue } = {}) {
    if (!scheduler || typeof scheduler.addSchedule !== 'function') {
      throw new TypeError('scheduler with addSchedule() is required');
    }
    schedule.on('trigger', () => {
      this.enqueueWorkflow(name, parameter, workQueue);
    });
    scheduler.addSchedule(schedule);
    return schedule;
  }
}

module.exports = {
  AgentWorkflowRunner,
  AgentWorkflowWorkItem,
};
