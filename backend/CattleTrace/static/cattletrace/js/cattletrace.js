(function(){
  const root = document.documentElement;
  if (localStorage.getItem('cattletrace-theme') === 'dark') root.classList.add('dark');
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => button.addEventListener('click', () => {
    root.classList.toggle('dark');
    localStorage.setItem('cattletrace-theme', root.classList.contains('dark') ? 'dark' : 'light');
  }));
  const sidebar = document.querySelector('[data-sidebar]');
  document.querySelectorAll('[data-sidebar-toggle]').forEach((button) => button.addEventListener('click', () => sidebar && sidebar.classList.toggle('collapsed')));
  const mobileButton = document.querySelector('[data-mobile-menu]');
  const overlay = document.querySelector('[data-mobile-overlay]');
  if (mobileButton) mobileButton.addEventListener('click', () => document.body.classList.add('mobile-nav-open'));
  if (overlay) overlay.addEventListener('click', () => document.body.classList.remove('mobile-nav-open'));
})();
