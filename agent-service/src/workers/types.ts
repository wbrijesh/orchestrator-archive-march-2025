// Common types used across worker modules

/**
 * Step interface for task steps
 */
export interface Step {
  name: string;
  data: any;
}

/**
 * Message interface for communication with parent process
 */
export interface WorkerMessage {
  status: string;
  taskId?: string;
  error?: string;
}
