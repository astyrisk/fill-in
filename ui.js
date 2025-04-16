/**
 * Fill-In Extension - UI Components
 * 
 * UI-related functions for the extension.
 */

/**
 * Adds a button to the page for triggering the autofill
 * @param {Function} onClickHandler - Function to call when button is clicked
 */
function addButton(onClickHandler) {
  if(document.getElementById('autofill-trigger-button')) return; // Don't add multiple buttons

  const button = document.createElement('button');
  button.textContent = 'Fill Form';
  button.id = 'autofill-trigger-button';
  button.style.position = 'fixed';
  button.style.top = '10px';
  button.style.right = '10px';
  button.style.zIndex = '9999';
  button.style.padding = '8px 15px';
  button.style.backgroundColor = '#0073b1';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';

  button.onclick = onClickHandler;

  document.body.appendChild(button);
}
