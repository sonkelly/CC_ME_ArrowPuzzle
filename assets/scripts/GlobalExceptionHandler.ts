import { _decorator } from 'cc';
import { CustomError } from './CustomError';

export class GlobalExceptionHandler {
    public static customHandle(): void {
        const originalOnError: OnErrorEventHandler | null = window.onerror;
        
        window.onerror = function(
            message: Event | string,
            source?: string,
            lineno?: number,
            colno?: number,
            error?: Error
        ): boolean {
            if (error instanceof CustomError) {
                console.warn(error.msg);
                return true;
            }
            
            if (originalOnError) {
                return originalOnError.call(window, message, source, lineno, colno, error);
            }
            
            return false;
        };
    }
}