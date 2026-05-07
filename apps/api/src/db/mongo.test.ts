import mongoose from "mongoose";
import { connectMongo } from "./mongo";

jest.mock("mongoose", () => ({
  connect: jest.fn(),
}));

const mockConnect = mongoose.connect as jest.Mock;

describe("connectMongo", () => {
  const originalUri = process.env["MONGO_URI"];

  afterEach(() => {
    mockConnect.mockReset();
    if (originalUri === undefined) {
      delete process.env["MONGO_URI"];
    } else {
      process.env["MONGO_URI"] = originalUri;
    }
  });

  it("deve lançar erro se MONGO_URI não estiver definida", async () => {
    delete process.env["MONGO_URI"];
    await expect(connectMongo()).rejects.toThrow("MONGO_URI não definida");
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("deve chamar mongoose.connect com a URI correta", async () => {
    process.env["MONGO_URI"] = "mongodb://localhost:27017/test";
    mockConnect.mockResolvedValue(undefined);
    await connectMongo();
    expect(mockConnect).toHaveBeenCalledWith("mongodb://localhost:27017/test");
  });

  it("deve propagar erro se mongoose.connect falhar", async () => {
    process.env["MONGO_URI"] = "mongodb://localhost:27017/test";
    mockConnect.mockRejectedValue(new Error("connection refused"));
    await expect(connectMongo()).rejects.toThrow("connection refused");
  });
});
