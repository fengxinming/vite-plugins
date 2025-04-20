export function displayTime(time: number): string {
  // display: {X}ms
  if (time < 1000) {
    return `${time}ms`;
  }

  time = time / 1000;

  // display: {X}s
  if (time < 60) {
    return `${time.toFixed(2)}s`;
  }

  // Calculate total minutes and remaining seconds
  const mins = Math.floor(time / 60);
  const seconds = Math.round(time % 60);

  // Handle case where seconds rounds to 60
  if (seconds === 60) {
    return `${mins + 1}m`;
  }

  // display: {X}m {Y}s
  return `${mins}m${seconds < 1 ? '' : ` ${seconds}s`}`;
}
