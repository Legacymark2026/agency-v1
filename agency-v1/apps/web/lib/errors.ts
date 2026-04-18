// Tipos de errores para autorización
// No usar "use server" aquí - estos son tipos puros que pueden importsarse en cualquier lugar

export class UnauthorizedError extends Error {
    status = 401;
    constructor() {
        super("No autenticado. Por favor inicia sesión.");
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends Error {
    status = 403;
    constructor(message = "No tienes permisos para esta acción.") {
        super(message);
        this.name = "ForbiddenError";
    }
}

export class NotFoundError extends Error {
    status = 404;
    constructor(message = "Recurso no encontrado") {
        super(message);
        this.name = "NotFoundError";
    }
}