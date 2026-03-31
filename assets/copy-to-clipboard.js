import { Component } from '@theme/component';
import { copyTextToClipboard } from '@theme/utilities';

/**
 * Handles copying text to clipboard, from an event like a click.
 * Optionally, reveals a success message after copying.
 * @extends {Component}
 */
class CopyToClipboardComponent extends Component {
  async copyToClipboard() {
    const copyContent = this.getAttribute('text-to-copy');

    if (!copyContent) return;

    await copyTextToClipboard(copyContent);

    const copySuccessMessage = this.refs.copySuccessMessage;

    if (copySuccessMessage instanceof Element) {
      copySuccessMessage.classList.remove('visually-hidden');
    }
  }
}

if (!customElements.get('copy-to-clipboard-component')) {
  customElements.define('copy-to-clipboard-component', CopyToClipboardComponent);
}
