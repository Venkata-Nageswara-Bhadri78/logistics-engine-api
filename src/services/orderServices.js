const ORDER_STATUSES = [
    'CREATED',
    'ASSIGNED',
    'IN_TRANSIT',
    'DELIVERED',
    'FAILED',
    'RETURNED',
    'COMPLETED'
];
  
const STATUS_TRANSITIONS = {
    CREATED: ['ASSIGNED'],
    ASSIGNED: ['IN_TRANSIT'],
    IN_TRANSIT: ['DELIVERED', 'FAILED'],
    DELIVERED: ['COMPLETED'],
    FAILED: ['RETURNED'],
    RETURNED: ['COMPLETED'],
    COMPLETED: []
};
  
const isValidStatus = (status) => {
    return ORDER_STATUSES.includes(status);
};
  
const isValidOrderStatusUpdate = (tableStatus, frontendStatus) => {
    if (!STATUS_TRANSITIONS[tableStatus]) {
      return false;
    }
    return STATUS_TRANSITIONS[tableStatus].includes(frontendStatus);
};
  
module.exports = {
    ORDER_STATUSES,
    isValidStatus,
    isValidOrderStatusUpdate
};
  