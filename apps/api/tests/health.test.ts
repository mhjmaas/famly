import { EventEmitter } from "node:events";
import type { NextFunction, RequestHandler } from "express";
import { createRequest, createResponse } from "node-mocks-http";
import { createApp } from "../src/app";

describe("GET /health", () => {
	it("responds with service status payload and HTTP 200", async () => {
		const app = createApp();
		const request = createRequest({
			method: "GET",
			url: "/v1/health",
		});
		const response = createResponse({
			eventEmitter: EventEmitter,
		});

		await new Promise<void>((resolve, reject) => {
			let settled = false;

			const finish = () => {
				if (!settled) {
					settled = true;
					resolve();
				}
			};

			response.on("end", finish);
			response.on("close", finish);
			response.on("error", (error) => {
				if (!settled) {
					settled = true;
					reject(error);
				}
			});

			const handler = app as unknown as RequestHandler;
			const next: NextFunction = (err?: unknown) => {
				if (err) {
					if (!settled) {
						settled = true;
						reject(err instanceof Error ? err : new Error(String(err)));
					}
					return;
				}

				finish();
			};

			handler(request, response, next);
		});

		expect(response.statusCode).toBe(200);
		expect(response.getHeader("content-type")).toMatch(/application\/json/);
		expect(response._getJSONData()).toEqual({
			status: "ok",
		});
	});
});
