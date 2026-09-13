/** Keep existing standalone work reachable when core scripts cannot load. */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.jQuery === 'function' && typeof Page === 'function') {
    return;
  }
  const panel = document.createElement('section');
  panel.id = 'runtime-fallback';
  panel.className = 'fixed top-0 left-0 right-0 pa4 bg-white black z-999';
  panel.setAttribute('role', 'alert');
  const title = document.createElement('h1');
  title.textContent = 'ETCETER4';
  const message = document.createElement('p');
  message.textContent =
    'The interactive site could not start. You can still open these works or reload to try again.';
  const links = document.createElement('nav');
  links.setAttribute('aria-label', 'Available works');
  for (const [label, href] of [
    ['OGOD', 'OGOD.html'],
    ['Text labyrinth', 'loophole.html'],
    ['Music on Bandcamp', 'https://etceter4.bandcamp.com'],
  ]) {
    const link = document.createElement('a');
    link.className = 'db mb3 blue';
    link.textContent = label;
    link.href = href;
    links.appendChild(link);
  }
  const reload = document.createElement('button');
  reload.type = 'button';
  reload.textContent = 'Reload site';
  reload.addEventListener('click', () => window.location.reload());
  panel.append(title, message, links, reload);
  document.body.appendChild(panel);
});
