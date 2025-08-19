import { ApiClient } from "../api-client/index.js";

/**
 * Delegate execution of an API tool to the provided ApiClient instance.
 * Mirrors the dispatch logic used in the main project.
 */
export async function executeToolMethod(client: ApiClient, toolName: string, args: any): Promise<any> {
    switch (toolName) {
        // GENERIC REQUEST
        case "http_request":
            return client.request(args.method, args.url, {
                headers: args.headers,
                body: args.body,
                timeout: args.timeout,
                retries: args.retries,
                backoff: args.backoff,
            });

        // SIMPLE VERB WRAPPERS
        case "get":
            return client.get(args.url, { headers: args.headers, timeout: args.timeout, retries: args.retries, backoff: args.backoff });
        case "post":
            return client.post(args.url, args.body, { headers: args.headers, timeout: args.timeout, retries: args.retries, backoff: args.backoff });
        case "put":
            return client.put(args.url, args.body, { headers: args.headers, timeout: args.timeout, retries: args.retries, backoff: args.backoff });
        case "delete":
            return client.delete(args.url, args.body, { headers: args.headers, timeout: args.timeout, retries: args.retries, backoff: args.backoff });

        // MULTIPART / FILE UPLOAD
        case "upload_multipart":
            return client.uploadMultipart(args.url, args.files || [], args.fields || {}, { headers: args.headers, timeout: args.timeout });

        // JSON SCHEMA VALIDATION
        case "validate_json_schema":
            return client.validateJsonSchema(args.data, args.schema);

        // CONCURRENT REQUESTS
        case "concurrent_requests":
            return client.concurrentRequests(args.requests || [], args.concurrency ?? 5);

        // ASSERT STATUS
        case "assert_status":
            return client.assertStatus(args.response, args.expected);

        default:
            throw new Error(`Unknown tool: ${toolName}`);
    }
}
