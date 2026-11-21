import { handleUpload } from '@vercel/blob/client';
import { requireUser } from './auth.js';

// Browser uploads straight to Vercel Blob (no 4.5MB function body limit). We only mint the client token here.
export async function handleBlobUpload(req, res, body) {
  const user = await requireUser(req);
  const json = await handleUpload({
    request: req,
    body,
    onBeforeGenerateToken: async () => ({
      addRandomSuffix: true,
      maximumSizeInBytes: 50 * 1024 * 1024,
      tokenPayload: JSON.stringify({ email: user.email }),
    }),
    onUploadCompleted: async () => {},
  });
  res.status(200).json(json);
}
