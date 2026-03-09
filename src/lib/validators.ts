import { z } from 'zod';

export const songSchema = z.object({
  title: z.string().min(1, 'A cím megadása kötelező').max(200),
  artist: z.string().min(1, 'Az előadó megadása kötelező').max(200),
  youtubeUrl: z
    .string()
    .url('Érvénytelen URL')
    .refine(
      (url) => /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url),
      'Érvényes YouTube linket adj meg'
    )
    .optional()
    .or(z.literal('')),
  difficulty: z.coerce.number().min(1).max(5).optional(),
  notes: z.string().max(1000).optional(),
  tabContent: z.string().max(50000).optional(),
  tabUrl: z
    .string()
    .url('Érvénytelen URL')
    .optional()
    .or(z.literal('')),
});

export type SongFormValues = z.infer<typeof songSchema>;
