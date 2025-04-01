/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export type SetReferralDto = object;

export interface CreateDepositDto {
  /** @example 10000000 */
  amount: number;
  /** @example "user123" */
  reference?: string;
}

export type CreateOrderDto = object;

export interface CreateReviewDto {
  /**
   * Rating from 1 to 5
   * @example 5
   */
  rating: number;
  /**
   * Optional review comment
   * @example "Completed the task quickly and accurately"
   */
  text?: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (securityData: SecurityDataType | null) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter((key) => "undefined" !== typeof query[key]);
    return keys
      .map((key) => (Array.isArray(query[key]) ? this.addArrayQueryParam(query, key) : this.addQueryParam(query, key)))
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string") ? JSON.stringify(input) : input,
    [ContentType.Text]: (input: any) => (input !== null && typeof input !== "string" ? JSON.stringify(input) : input),
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (cancelToken: CancelToken): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(`${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`, {
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
      },
      signal: (cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal) || null,
      body: typeof body === "undefined" || body === null ? null : payloadFormatter(body),
    }).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title EVE Board API
 * @version 1.0
 * @contact
 *
 * API для заказов и исполнителей в EVE Online
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * No description
     *
     * @tags Users
     * @name UserControllerGetAll
     * @summary Get users (all or filtered)
     * @request GET:/api/user
     */
    userControllerGetAll: (
      query?: {
        /** Search by name or characterId */
        search?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<object[], any>({
        path: `/api/user`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UserControllerGetMe
     * @summary Get full profile of the authenticated user
     * @request GET:/api/user/me
     * @secure
     */
    userControllerGetMe: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/user/me`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UserControllerSearchUsers
     * @summary Search users
     * @request GET:/api/user/search
     */
    userControllerSearchUsers: (
      query: {
        /**
         * Search query
         * @example "eve"
         */
        q: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/user/search`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UserControllerGetOne
     * @summary Get user by ID
     * @request GET:/api/user/{id}
     */
    userControllerGetOne: (id: string, params: RequestParams = {}) =>
      this.request<SetReferralDto, any>({
        path: `/api/user/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UserControllerGetMyTransactions
     * @summary Get transactions of the authenticated user
     * @request GET:/api/user/transactions
     * @secure
     */
    userControllerGetMyTransactions: (
      query?: {
        limit?: number;
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/user/transactions`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UserControllerSetReferral
     * @request POST:/api/user/set-referral
     * @secure
     */
    userControllerSetReferral: (data: SetReferralDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/user/set-referral`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UserControllerBecomeExecutor
     * @summary Become executor
     * @request POST:/api/user/become-executor
     * @secure
     */
    userControllerBecomeExecutor: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/user/become-executor`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transactions
     * @name TransactionControllerCreate
     * @summary Create a deposit request to top up your balance
     * @request POST:/api/transaction/deposit
     * @secure
     */
    transactionControllerCreate: (data: CreateDepositDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/transaction/deposit`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transactions
     * @name TransactionControllerGetAll
     * @summary Get your transaction history
     * @request GET:/api/transaction
     * @secure
     */
    transactionControllerGetAll: (
      query?: {
        /** @example 20 */
        limit?: number;
        /** @example 1 */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/transaction`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transactions
     * @name TransactionControllerRequestWithdraw
     * @summary Request a withdrawal from your internal balance
     * @request POST:/api/transaction/withdraw
     * @secure
     */
    transactionControllerRequestWithdraw: (
      data: {
        /** @example 1000000000 */
        amount: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/transaction/withdraw`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transactions
     * @name TransactionControllerCancelWithdraw
     * @summary Cancel a pending withdrawal request
     * @request DELETE:/api/transaction/withdraw/{id}
     * @secure
     */
    transactionControllerCancelWithdraw: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/transaction/withdraw/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrderControllerGetTypes
     * @summary Get available order types (enum values)
     * @request GET:/api/order/types
     */
    orderControllerGetTypes: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/order/types`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrderControllerGetAll
     * @summary Get orders (optionally filtered)
     * @request GET:/api/order
     */
    orderControllerGetAll: (
      query?: {
        userId?: string;
        limit?: number;
        page?: number;
        type?:
          | "KILL_TARGET"
          | "SCAN_WORMHOLE"
          | "SCOUT_SYSTEM"
          | "LOGISTICS"
          | "ESCORT"
          | "STRUCTURE_WORK"
          | "CHARACTER_INFO"
          | "ROUTE_PLANNING"
          | "COUNTER_INTEL"
          | "EVENT_FARMING"
          | "PVP_ASSIST"
          | "OTHER";
        status?: "ACTIVE" | "TAKEN" | "DONE" | "CANCELED";
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/order`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrderControllerCreate
     * @summary Create a new order
     * @request POST:/api/order
     * @secure
     */
    orderControllerCreate: (data: CreateOrderDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/order`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrderControllerGetOne
     * @summary Get order by ID
     * @request GET:/api/order/{id}
     */
    orderControllerGetOne: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/order/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrderControllerDelete
     * @summary Delete order (creator only)
     * @request DELETE:/api/order/{id}
     * @secure
     */
    orderControllerDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/order/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrderControllerTake
     * @summary Take order as executor
     * @request POST:/api/order/{id}/take
     * @secure
     */
    orderControllerTake: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/order/${id}/take`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrderControllerUpdateStatus
     * @summary Update order status (DONE or CANCELED)
     * @request PATCH:/api/order/{id}/status
     * @secure
     */
    orderControllerUpdateStatus: (
      id: string,
      query: {
        status: "ACTIVE" | "TAKEN" | "DONE" | "CANCELED";
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/order/${id}/status`,
        method: "PATCH",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrderControllerSendMessage
     * @summary Send message to order chat
     * @request POST:/api/order/{id}/message
     * @secure
     */
    orderControllerSendMessage: (
      id: string,
      query: {
        text: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/order/${id}/message`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrderControllerGetMessages
     * @summary Get messages for order
     * @request GET:/api/order/{id}/messages
     */
    orderControllerGetMessages: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/order/${id}/messages`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrderControllerComplain
     * @summary Submit a complaint for an order
     * @request POST:/api/order/{id}/complain
     * @secure
     */
    orderControllerComplain: (
      id: string,
      query: {
        reason: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/order/${id}/complain`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Reviews
     * @name ReviewControllerCreate
     * @summary Leave a review for a completed order
     * @request POST:/api/order/{id}/review
     * @secure
     */
    reviewControllerCreate: (id: string, data: CreateReviewDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/order/${id}/review`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Reviews
     * @name ReviewControllerGetUserReviews
     * @summary Get reviews for a specific user
     * @request GET:/api/order/{id}/review/user/{userId}
     * @secure
     */
    reviewControllerGetUserReviews: (userId: string, id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/order/${id}/review/user/${userId}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthControllerRedirectToEve
     * @summary Редирект на EVE Online SSO
     * @request GET:/api/auth/eve
     */
    authControllerRedirectToEve: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/auth/eve`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthControllerEveGetCallback
     * @request GET:/api/auth/eve/callback
     */
    authControllerEveGetCallback: (
      query: {
        code: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/auth/eve/callback`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthControllerEveCallback
     * @summary Получить JWT по коду от EVE
     * @request POST:/api/auth/eve/callback
     */
    authControllerEveCallback: (
      data: {
        /** @example "abc123..." */
        code?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "jwt-token-here" */
          token?: string;
        },
        any
      >({
        path: `/api/auth/eve/callback`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthControllerGetMe
     * @summary Получить текущего пользователя по JWT
     * @request GET:/api/auth/me
     * @secure
     */
    authControllerGetMe: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/auth/me`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthControllerDiscordCallback
     * @request GET:/api/auth/discord/callback
     */
    authControllerDiscordCallback: (
      query: {
        code: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/auth/discord/callback`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthControllerLinkDiscord
     * @summary Link Discord account to current user
     * @request POST:/api/auth/link
     * @secure
     */
    authControllerLinkDiscord: (
      data: {
        /** @example "235822777678954496" */
        id: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/api/auth/link`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Systems
     * @name SystemControllerGetAll
     * @summary Get all systems
     * @request GET:/api/system
     */
    systemControllerGetAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/system`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Systems
     * @name SystemControllerSearch
     * @summary Search systems by name (min 3 chars)
     * @request GET:/api/system/search
     */
    systemControllerSearch: (
      query: {
        q: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/system/search`,
        method: "GET",
        query: query,
        ...params,
      }),
  };
}
