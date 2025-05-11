export function success<T>(message: string, data?: T) {
    return {
        success: true,
        message,
        data,
    };
}

export function error(message: string, code = 400) {
    return {
        success: false,
        message,
        code,
    };
}
