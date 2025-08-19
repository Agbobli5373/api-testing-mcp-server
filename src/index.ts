#!/usr/bin/env node

import { OptimizedApiMCPServer } from "./server/optimized-server.js";

const server = new OptimizedApiMCPServer();
server.run().catch(console.error);
