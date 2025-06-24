console.log("Hello from main.js");

// Header mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
  const menuToggleButton = document.querySelector('[data-action="click->header#openMenu"]');
  const menuCloseButton = document.querySelector('[data-action="click->header#closeMenu"]');
  const mobileMenu = document.querySelector('[data-header-target="menu"]');
  const backdrop = document.querySelector('[data-header-target="backdrop"]');

  function openMenu() {
    if (mobileMenu && backdrop) {
      mobileMenu.classList.remove('hidden');
      backdrop.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMenu() {
    if (mobileMenu && backdrop) {
      mobileMenu.classList.add('hidden');
      backdrop.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  // Open menu when hamburger button is clicked
  if (menuToggleButton) {
    menuToggleButton.addEventListener('click', (e) => {
      e.preventDefault();
      openMenu();
    });
  }

  // Close menu when close button is clicked
  if (menuCloseButton) {
    menuCloseButton.addEventListener('click', (e) => {
      e.preventDefault();
      closeMenu();
    });
  }

  // Close menu when backdrop is clicked
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeMenu();
      }
    });
  }

  // Close menu when Escape key is pressed
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu && !mobileMenu.classList.contains('hidden')) {
      closeMenu();
    }
  });

  // Initialize menu state
  if (mobileMenu && backdrop) {
    mobileMenu.classList.add('hidden');
    backdrop.classList.add('hidden');
  }
});
