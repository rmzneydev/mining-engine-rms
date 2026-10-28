import { mkdirSync, writeFileSync } from 'node:fs';
import { buildSwaggerSpec } from '../src/config/swagger-spec.js';

mkdirSync('dist', { recursive: true });
writeFileSync('dist/openapi.json', JSON.stringify(buildSwaggerSpec(), null, 2));
