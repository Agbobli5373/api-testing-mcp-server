#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

try {
  // Delegate to the existing CommonJS wrapper
  require('./wrapper.cjs');
} catch (err) {
  console.error('Failed to load wrapper.cjs:', err);
  process.exit(1);
}
