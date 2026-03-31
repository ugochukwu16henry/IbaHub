import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IbaHub',
    short_name: 'IbaHub',
    description:
      'Unified logistics, gig, and retail platform with modular integrations.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafa',
    theme_color: '#f97316',
    icons: []
  };
}
