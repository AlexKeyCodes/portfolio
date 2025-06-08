document.addEventListener('DOMContentLoaded', () => {
  const modal = document.querySelector('.modal-container')
  const openButtons = document.querySelectorAll('.open-modal')
  const closeButtons = document.querySelectorAll('[data-modal-close]')
  const backdrop = document.querySelector('.modal-backdrop')

  function openModal() {
    modal.classList.remove('hidden')
  }

  function closeModal() {
    modal.classList.add('hidden')
  }

  // Open modal when clicking the "Hire Me!" button
  openButtons.forEach((button) => {
    button.addEventListener('click', openModal)
  })

  // Close modal when clicking close buttons
  closeButtons.forEach((button) => {
    button.addEventListener('click', closeModal)
  })

  // Close modal when clicking the backdrop
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeModal()
    }
  })

  // Close modal when pressing Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal()
    }
  })
})
