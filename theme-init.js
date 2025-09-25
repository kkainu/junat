(function () {
  try {
    const storageKey = 'junat-theme';
    const storedTheme = localStorage.getItem(storageKey);
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const theme = storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : prefersLight
        ? 'light'
        : 'dark';

    document.documentElement.dataset.theme = theme;

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'light' ? '#f8fafc' : '#121826');
    }
  } catch (error) {
    console.warn('Unable to initialise theme', error);
  }
})();
