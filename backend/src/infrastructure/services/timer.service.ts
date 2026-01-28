export class Timer {
    private startTime: number = 0;
    private endTime: number = 0;
    private label: string;

    constructor(label?: string) {
        this.label = label || 'Timer';
    }

    start(): this {
        this.startTime = performance.now();
        return this;
    }

    stop(): number {
        this.endTime = performance.now();
        return this.durationMs;
    }

    get durationMs(): number {
        const end = this.endTime || performance.now();
        return end - this.startTime;
    }

    get durationFormatted(): string {
        return this.formatDuration(this.durationMs);
    }

    log(): this {
        console.log(`⏱️ ${this.label}: ${this.durationFormatted}`);
        return this;
    }

    formatDuration(ms: number): string {
        if (ms < 1000) {
            return `${ms.toFixed(2)}ms`;
        }
        if (ms < 60000) {
            return `${(ms / 1000).toFixed(2)}s`;
        }
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(1);
        return `${minutes}m ${seconds}s`;
    }
}