// A thrown HttpError becomes a clean { error: message } response with the
// right status code, via middleware/errorHandler.ts. Anything else thrown
// is treated as a bug and logged with its full stack — see errorHandler.ts.
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
