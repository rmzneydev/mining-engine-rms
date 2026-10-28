# Frontend

SPA de Mining Engine RMS construida con React 19, TypeScript, Vite 8, Tailwind CSS 4 y React Router 7.

## Scripts

```bash
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run build    # type-check + build de producción
npm run preview  # sirve el build localmente
npm run lint     # ESLint
npm test         # Vitest + Testing Library
```

## Variables de entorno

Copiar `.env.example` a `.env`:

```text
VITE_AUTH_API_URL=http://localhost:3001
VITE_BUSINESS_API_URL=http://localhost:8002
```

Las URLs se resuelven en tiempo de build. La sesión se guarda en `localStorage` bajo la clave `mining-rms.token` y se hidrata con `GET /api/auth/me`.

## Estructura

- `src/lib`: cliente HTTP, sesión, acceso a APIs, formato y estados.
- `src/context` y `src/hooks`: sesión y mensajes flash.
- `src/components`: layout, guardas y componentes reutilizables.
- `src/pages`: login, dashboard, clientes, motores, órdenes y usuarios.

La documentación completa (arquitectura, API, Docker y pruebas) está en el [README raíz](../README.md).
