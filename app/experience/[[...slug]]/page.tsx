'use client';

// Route used by Whop platform to load your app experience. We render the editor UI.
// The catch-all path ensures /experience and any nested path won't 404 locally.
import EditorPage from '@/app/editor/page';

export default function ExperiencePage() {
  return <EditorPage />;
}
