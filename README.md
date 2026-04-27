# ClockHub

- Una plataforma de gestión de horarios y calendarios.

## Tecnologias

- Next.js
- TypeScript
- TailwindCSS
- Prisma
- PostgreSQL
- JWT
- Zod
- Cookie

## Instalacion

```bash
    npm install
    npm run dev
```

---

# Guía de Estudio: Sistema CRUD Anidado y Autenticación con Next.js

Esta guía detalla los pasos estructurales necesarios para replicar o entender la arquitectura completa de la aplicación ClockHub. El sistema incluye autenticación JWT, un modelo de Base de Datos relacional, validación de schemas y un panel dinámico con Control de Acceso Basado en Roles (RBAC).

Sigue este orden metodológico para construir o explicar la aplicación de manera profesional.

## 1. Capa de Datos (Prisma)

Todo proyecto profesional debe comenzar definiendo cómo se estructura y relaciona la información.

1. Abre el archivo `prisma/schema.prisma`.
2. Define los modelos en orden de importancia. Para este proyecto:
   - Modelo `User`: Maneja credenciales y el `role` (ADMIN, MANAGER, EMPLOYEE).
   - Modelo `Schedule`: Representa el turno de un usuario. Tiene una relación de 1 a N con el modelo User.
   - Modelo `Task`: Representa las actividades creadas dentro de un horario. Tiene una relación de 1 a N con el modelo Schedule. Clave: Añadir `onDelete: Cascade` para que si se borra el horario, se borren sus tareas.
   - Modelo `AuditLog`: Registra todas las acciones importantes (CRUD) de los usuarios.
3. Tras definir el esquema, sincroniza la base de datos usando:
   `npx prisma db push`
   `npx prisma generate`

## 2. Contratos y Validación (Zod e Interfaces)

Antes de programar la lógica del servidor, debes definir estrictamente qué datos vas a recibir y procesar.

1. Usa la biblioteca `zod` para proteger los endpoints.
2. Define schemas para validar el cuerpo (body) de las peticiones HTTP.
   - Ejemplo en registro: Exigir que el password tenga al menos 6 caracteres.
   - Ejemplo en tareas: Exigir que el titulo sea un string valido y no vacio (`z.string().min(3)`).
3. Utiliza `safeParse` en los controladores de Next.js. Esto evita que el servidor falle violentamente (error 500) si un usuario envía datos mal formados, permitiéndote retornar un código 400 (Bad Request) con detalles precisos.

## 3. Lógica de Servidor (APIs y Rutas)

Con la base de datos lista y los datos validados, puedes construir las cañerías del sistema.

1. Estructura RESTful:
   - Crear una carpeta `src/app/api/...` para tus rutas separadas de la interfaz visual.
   - Crea endpoints bajo `/api/schedules` para la lógica principal.
   - Crea rutas anidadas como `/api/schedules/[id]/tasks` para recursos dependientes.
   - Crea rutas aisladas como `/api/tasks/[id]` para actualizar recursos individuales (PATCH y DELETE).

2. Transacciones y Lógica de Negocio:
   - Cuando una operación requiera cambiar múltiples tablas al tiempo, usa `prisma.$transaction`.
   - Ejemplo crítico: Al crear una tarea marcada con "isCritical", debes crear el registro en la tabla Task, registrar las acciones en la tabla AuditLog y actualizar el estado de Schedule a PENDING, todo dentro de la misma transacción.

3. Seguridad:
   - Verifica las cookies en Server-Side.
   - Usa un middleware o funciones utilitarias (`verifyToken`) para extraer el Payload JWT.
   - Bloquea peticiones de usuarios sin los permisos adecuados comprobando su `role`.

## 4. Desarrollo Frontend (Componentes React)

Finalmente, conecta los datos a la interfaz visual de forma reactiva.

1. Manejo de Estado (useState y useEffect):
   - Usa estados separados para el control de pestañas, listas de datos (Schedules, Tareas) y modales.
   - Implementa funciones genéricas como `fetchData` que soliciten datos usando `fetch` e inyecten la información en la tabla correspondiente.
   
2. Implementacion de UI/UX:
   - Divide la visualización en Paneles: un Sidebar para navegación y un cuerpo central para las tablas de datos.
   - Almacena IDs seleccionados (ej: `selectedScheduleId`) para abrir cajones anidados y listar subtareas en el mismo dashboard sin cambiar de página.
   
3. Control de Acceso Visual (RBAC Frontend):
   - Limita lo que el usuario ve mapeando opciones según su rol. Si `user.role === 'EMPLOYEE'`, excluye de la navegación las pestañas de "Auditoría" y "Usuarios" y bloquea (disabled) los controles tipo dropdown sensibles (para cambiar el estado de otros).

## Criterios de Evaluación Final (Checklist)
- [X] El servidor levanta sin errores de inicialización.
- [X] Zod filtra peticiones con cuerpo incorrecto, previniendo errores de Prisma.
- [X] Se guardan registros en la tabla AuditLog correctamente en cada acción.
- [X] La base de datos aplica el cambio de "Status" de forma atómica.
- [X] El dashboard renderiza componentes condicionalmente basándose en roles.