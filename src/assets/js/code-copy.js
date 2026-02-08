document.addEventListener('DOMContentLoaded', () => {
  // Find all code blocks
  const codeBlocks = document.querySelectorAll('pre');

  codeBlocks.forEach((block) => {
    // Create wrapper for positioning
    block.style.position = 'relative';

    // Create copy button
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.textContent = 'Copy';

    // Add click handler
    button.addEventListener('click', async () => {
      const code = block.querySelector('code');
      const text = code ? code.textContent : block.textContent;

      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied!';
      setTimeout(() => { button.textContent = 'Copy'; }, 2000);
    });

    block.appendChild(button);
  });
});
