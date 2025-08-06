import { z } from "zod";
import {
  ConfigurationError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterServerError,
  OpenRouterTimeoutError,
  ResponseValidationError,
} from "../errors";
import type {
  OpenRouterServiceOptions,
  OpenRouterRequest,
  OpenRouterResponse,
  OpenRouterMessage,
  OpenRouterResponseFormat,
  OpenRouterServiceMessageOptions,
} from "../../types";
import type { SupabaseClient } from "../../db/supabase.client";
import fetch from "cross-fetch";

const DEFAULT_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const DEFAULT_TIMEOUT = 60000; // 60 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly defaultModel: string;
  private readonly defaultParams: Record<string, unknown>;
  private readonly supabase: SupabaseClient;

  constructor(options: OpenRouterServiceOptions, supabase: SupabaseClient) {
    if (!options.apiKey) {
      throw new ConfigurationError("OpenRouter API key is required");
    }

    this.apiKey = options.apiKey;
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
    this.defaultModel = options.defaultModel ?? DEFAULT_MODEL;
    this.defaultParams = options.defaultParams ?? {};
    this.supabase = supabase;
  }

  private buildPayload(options: {
    systemMessage: string;
    userMessage: string;
    modelName?: string;
    modelParams?: Record<string, unknown>;
    responseFormat?: OpenRouterResponseFormat;
  }): OpenRouterRequest {
    const messages: OpenRouterMessage[] = [
      { role: "system", content: options.systemMessage },
      { role: "user", content: options.userMessage },
    ];

    return {
      messages,
      model: options.modelName ?? this.defaultModel,
      response_format: options.responseFormat,
      parameters: {
        ...this.defaultParams,
        ...options.modelParams,
        response_format: options.responseFormat, // Add response_format to parameters as well
      },
    };
  }

  private async sendHttpRequest(payload: OpenRouterRequest, retryCount = 0): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    try {
      console.log("Sending request to OpenRouter:", {
        endpoint: this.endpoint,
        model: payload.model,
        messageCount: payload.messages.length,
        hasResponseFormat: !!payload.response_format,
        payload: JSON.stringify(payload),
      });

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://10xdevs.com",
          "X-Title": "10xDevs",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        keepalive: true,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let responseData: unknown;

      try {
        responseData = JSON.parse(responseText);
      } catch {
        console.error("Failed to parse response as JSON:", {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText.substring(0, 1000), // Log first 1000 chars only
          contentType: response.headers.get("content-type"),
        });
        throw new OpenRouterServerError("Invalid JSON response from OpenRouter API");
      }

      if (!response.ok) {
        console.error("OpenRouter API error:", {
          status: response.status,
          statusText: response.statusText,
          response: responseData,
        });

        switch (response.status) {
          case 401:
            throw new OpenRouterAuthError("Invalid API key or unauthorized access");
          case 429:
            throw new OpenRouterRateLimitError("Rate limit exceeded");
          case 500:
          case 502:
          case 503:
          case 504:
            throw new OpenRouterServerError(`Server error: ${response.status} - ${JSON.stringify(responseData)}`);
          default:
            throw new Error(`Unexpected error: ${response.status} - ${JSON.stringify(responseData)}`);
        }
      }

      const typedResponse = responseData as OpenRouterResponse;
      console.log("OpenRouter response received:", {
        model: typedResponse.model,
        choicesCount: typedResponse.choices?.length,
        usage: typedResponse.usage,
      });

      return typedResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      console.error("OpenRouter request failed:", {
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause,
              }
            : String(error),
        retryCount,
        model: payload.model,
        endpoint: this.endpoint,
      });

      // Handle network errors
      if (error instanceof Error) {
        const cause = error.cause as { code?: string; errno?: number } | undefined;

        // DNS resolution errors
        if (cause?.code === "ENOTFOUND") {
          if (retryCount < MAX_RETRIES) {
            console.log(`DNS resolution failed, retrying (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return this.sendHttpRequest(payload, retryCount + 1);
          }
          throw new OpenRouterServerError(
            "Failed to resolve OpenRouter API hostname. Please check your internet connection."
          );
        }

        // Connection errors
        if (cause?.code === "ECONNREFUSED" || cause?.code === "ECONNRESET") {
          if (retryCount < MAX_RETRIES) {
            console.log(`Connection error, retrying (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return this.sendHttpRequest(payload, retryCount + 1);
          }
          throw new OpenRouterServerError(
            "Failed to connect to OpenRouter API. Please check your internet connection."
          );
        }
      }

      if (error instanceof OpenRouterAuthError) {
        throw error;
      }

      if (
        (error instanceof OpenRouterRateLimitError || error instanceof OpenRouterServerError) &&
        retryCount < MAX_RETRIES
      ) {
        console.log(`Retrying request (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.sendHttpRequest(payload, retryCount + 1);
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new OpenRouterTimeoutError("Request timed out");
      }

      throw error;
    }
  }

  private validateResponse<T>(response: OpenRouterResponse, schema: z.ZodSchema<T>): T {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error("Empty response from OpenRouter:", response);
        throw new ResponseValidationError("Empty response from OpenRouter", { response });
      }

      console.log("Validating OpenRouter response content:", { content });

      let parsedContent: unknown;
      try {
        parsedContent = JSON.parse(content);
      } catch (error) {
        console.error("Failed to parse JSON response:", { content, error });
        throw new ResponseValidationError("Invalid JSON in response", { content });
      }

      try {
        return schema.parse(parsedContent);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Response validation failed:", {
            errors: error.errors,
            content: parsedContent,
          });
          throw new ResponseValidationError("Response validation failed", error.errors);
        }
        throw error;
      }
    } catch (error) {
      if (error instanceof ResponseValidationError) {
        throw error;
      }
      console.error("Unexpected error during response validation:", error);
      throw new ResponseValidationError("Failed to validate response", error);
    }
  }

  private async logError(
    error: Error,
    model: string,
    sourceTextHash: string,
    sourceTextLength: number,
    userId: string
  ): Promise<void> {
    try {
      let errorCode = "UNKNOWN_ERROR";
      if (error instanceof OpenRouterAuthError) errorCode = "AUTH_ERROR";
      if (error instanceof OpenRouterRateLimitError) errorCode = "RATE_LIMIT";
      if (error instanceof OpenRouterServerError) errorCode = "SERVER_ERROR";
      if (error instanceof OpenRouterTimeoutError) errorCode = "TIMEOUT";
      if (error instanceof ResponseValidationError) errorCode = "VALIDATION_ERROR";

      await this.supabase.from("generation_error_logs").insert({
        model,
        error_code: errorCode,
        error_message: error.message,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        user_id: userId,
        error_details: error instanceof ResponseValidationError ? error.details : undefined,
      });
    } catch (e) {
      console.error("Failed to log OpenRouter error:", e);
    }
  }

  async sendMessage<T>(options: OpenRouterServiceMessageOptions<T>): Promise<T> {
    try {
      const payload = this.buildPayload(options);
      const response = await this.sendHttpRequest(payload);
      return this.validateResponse(response, options.validationSchema);
    } catch (error) {
      await this.logError(
        error as Error,
        options.modelName ?? this.defaultModel,
        options.sourceTextHash,
        options.sourceTextLength,
        options.userId
      );
      throw error;
    }
  }
}
