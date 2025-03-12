
      import { fileURLToPath } from 'url';
      import { dirname } from 'path';
      import { parentPort } from 'worker_threads';
      import { createRequire } from 'module';
      
      // Setup ESM compatibility
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const require = createRequire(import.meta.url);
      
      // Import tsx to handle TypeScript files
      const tsx = require('tsx');
      
      // Register tsx handler for TypeScript files
      tsx.register();
      
      // Now we can dynamically import the TypeScript file
      import('/Users/brijesh/projects/ongoing/orchestrator/agent-service/src/workers/task-worker.ts').then(module => {
        // The module is loaded, and we can access its exports
        if (parentPort) {
          parentPort.on('message', (task) => {
            if (module.default && typeof module.default === 'function') {
              module.default(task);
            } else if (module.processTask && typeof module.processTask === 'function') {
              module.processTask(task);
            }
          });
        }
      }).catch(error => {
        console.error('Error importing worker module:', error);
      });
    