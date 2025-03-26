import { UserRole } from '@prisma/client';

declare module 'express' {
    interface User {
        id: string;
        name: string;
        role: UserRole;
    }

    interface Request {
        user?: User;
    }
}
