class StatusChangeHandler {
  constructor(private oldStatus: number, private newStatus: number) {}

  public async run() {
    console.log("Status changed from", this.oldStatus, "to", this.newStatus);
  }
}

export { StatusChangeHandler };
