export class HttpError extends Error {
  constructor(status, message, code = "ERROR", details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
