// Simple progress loader for UI communication

/**
 * Simple progress loader for displaying operation progress to the UI
 * Provides sophisticated loading animation with progress tracking
 */
export class SimpleProgressLoader {
  private isVisible: boolean = false;
  private currentProgress: number = 0;

  constructor() {
    this.isVisible = false;
    this.currentProgress = 0;
  }

  /**
   * Show the progress loader
   */
  show(): void {
    this.isVisible = true;
    this.currentProgress = 0;

    figma.ui.postMessage({
      type: 'sophisticated-loader-show'
    });
  }

  /**
   * Update progress percentage
   * @param percentage - Progress percentage (0-100)
   */
  updateProgress(percentage: number): void {
    if (!this.isVisible) return;

    this.currentProgress = Math.min(100, Math.max(0, percentage));
    figma.ui.postMessage({
      type: 'sophisticated-loader-update',
      percentage: this.currentProgress
    });
  }

  /**
   * Hide the progress loader
   * Completes the progress bar before hiding
   */
  async hide(): Promise<void> {
    if (!this.isVisible) return;

    // Complete the progress bar before hiding
    if (this.currentProgress < 100) {
      this.updateProgress(100);
      await new Promise<void>(resolve => setTimeout(resolve, 150));
    }

    this.isVisible = false;

    figma.ui.postMessage({
      type: 'sophisticated-loader-hide'
    });
  }

  /**
   * Convenience method for starting Phase 1 operations
   */
  showPhase1(): void {
    this.show();
    this.updateProgress(10);
  }

  /**
   * Mark Phase 1 as complete
   */
  showPhase1Complete(): void {
    this.updateProgress(50);
  }

  /**
   * Start Phase 2 operations
   */
  showPhase2(): void {
    this.updateProgress(55);
  }

  /**
   * Mark Phase 2 as complete
   * @param _aliasCount - Number of aliases processed (for logging)
   */
  showPhase2Complete(_aliasCount?: number): void {
    this.updateProgress(95);
  }

  /**
   * Mark operation as complete
   */
  showComplete(): void {
    this.updateProgress(100);
  }

  /**
   * Check if loader is currently visible
   */
  get visible(): boolean {
    return this.isVisible;
  }

  /**
   * Get current progress percentage
   */
  get progress(): number {
    return this.currentProgress;
  }

  /**
   * Set progress with validation and message
   * @param percentage - Progress percentage (0-100)
   * @param message - Optional message to display
   */
  setProgress(percentage: number, message?: string): void {
    this.updateProgress(percentage);

    if (message) {
      figma.ui.postMessage({
        type: 'sophisticated-loader-message',
        message
      });
    }
  }

  /**
   * Show error state and hide loader
   * @param errorMessage - Error message to display
   */
  async showError(errorMessage: string): Promise<void> {
    figma.ui.postMessage({
      type: 'sophisticated-loader-error',
      message: errorMessage
    });

    await new Promise<void>(resolve => setTimeout(resolve, 500));
    await this.hide();
  }
}