export class HTTPError extends Error {
  status;

  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = "HTTPError";
  }
}
