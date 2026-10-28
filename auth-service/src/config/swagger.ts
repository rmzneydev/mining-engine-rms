import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';
import { buildSwaggerSpec } from './swagger-spec.js';

// En producción (dist/) se sirve la spec generada en el build (openapi.json),
// porque src/ no existe en la imagen. En desarrollo se genera desde src/.
function loadSpec(): object {
  const prebuilt = fileURLToPath(new URL('../openapi.json', import.meta.url));
  if (existsSync(prebuilt)) {
    return JSON.parse(readFileSync(prebuilt, 'utf-8'));
  }
  return buildSwaggerSpec();
}

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(loadSpec()));
}
