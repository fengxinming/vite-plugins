import './style.css';
import './reset.css';

export function render(container: HTMLElement): void {
  container.innerHTML = '<div class="component">Styled Component</div>';
}
