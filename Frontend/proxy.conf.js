/**
 * Angular 18+ dev-server (Vite): use array + context so /api is proxied instead of falling through to index.html.
 */
module.exports = [
  {
    context: ['/api', '/uploads'],
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
  },
];
