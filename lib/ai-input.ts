import {z} from 'zod';
export const aiInputSchema = z.object({text:z.string().trim().min(1).max(20000),mode:z.enum(['ask','extract'])});
