'use strict';

const WorkItemState = Object.freeze({
  Created: 'Created',
  Queued: 'Queued',
  Scheduled: 'Scheduled',
  Running: 'Running',
  Failing: 'Failing',
  Completed: 'Completed',
  Deleted: 'Deleted',
});

module.exports = {
  WorkItemState,
};
