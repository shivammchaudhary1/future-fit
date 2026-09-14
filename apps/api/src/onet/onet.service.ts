import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ONET_CACHE_TTL_MS,
  ONET_DEFAULT_BASE_URL,
  ONET_DEFAULT_TIMEOUT_MS,
  ONET_PATHS,
} from "./onet.constants.js";

interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

@Injectable()
export class OnetService {
  private readonly cache = new Map<string, CacheEntry>();
  constructor(private readonly config: ConfigService) {}

  questions() {
    return this.get(ONET_PATHS.miniQuestions, { start: "1", end: "30" }, true);
  }
  results(answers: number[]) {
    return this.get(ONET_PATHS.results, { answers: answers.join("") });
  }
  matches(answers: number[]) {
    return this.get(ONET_PATHS.matchingCareers, { answers: answers.join("") });
  }
  search(keyword: string, start: number, end: number) {
    return this.get(
      ONET_PATHS.search,
      { keyword, start: String(start), end: String(end) },
      true,
    );
  }
  career(code: string) {
    return this.get(ONET_PATHS.career(code), {}, true);
  }
  careerTopic(code: string, topic: string) {
    return this.get(ONET_PATHS.careerTopic(code, topic), {}, true);
  }

  async profile(answers: number[]) {
    const [results, careers] = await Promise.all([
      this.results(answers),
      this.matches(answers),
    ]);
    return {
      scoringProvider: "O*NET Interest Profiler",
      scoringVersion: "api-v2",
      results,
      careers,
    };
  }

  private async get(
    path: string,
    params: Record<string, string>,
    cacheable = false,
  ): Promise<unknown> {
    const apiKey = this.config.get<string>("ONET_API_KEY");
    if (!apiKey)
      throw new ServiceUnavailableException(
        "O*NET credentials are not configured.",
      );
    const url = new URL(
      path,
      this.config.get("ONET_BASE_URL", ONET_DEFAULT_BASE_URL),
    );
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, value),
    );
    const cached = this.cache.get(url.toString());
    if (cacheable && cached && cached.expiresAt > Date.now())
      return cached.value;
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.get<number>(
        "ONET_REQUEST_TIMEOUT_MS",
        ONET_DEFAULT_TIMEOUT_MS,
      ),
    );
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-API-Key": apiKey,
        },
        signal: controller.signal,
      });
      if (!response.ok)
        throw new BadGatewayException(
          `O*NET returned status ${response.status}.`,
        );
      const value: unknown = await response.json();
      if (cacheable) {
        if (this.cache.size >= 500) this.cache.clear();
        this.cache.set(url.toString(), {
          value,
          expiresAt: Date.now() + ONET_CACHE_TTL_MS,
        });
      }
      return value;
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      throw new BadGatewayException("O*NET is temporarily unavailable.");
    } finally {
      clearTimeout(timeout);
    }
  }
}
