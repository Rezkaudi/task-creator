export class HttpError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "HttpError";
    }
}

export class PaymentRequiredError extends HttpError {
    constructor(message: string) {
        super(message, 402);
        this.name = "PaymentRequiredError";
    }
}
