import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

const uuid = { type: 'string', format: 'uuid' } satisfies SchemaObject;
const dateTime = { type: 'string', format: 'date-time' } satisfies SchemaObject;

export const problemDetailsSchema: SchemaObject = {
  type: 'object',
  properties: {
    type: { type: 'string', format: 'uri' },
    title: { type: 'string' },
    status: { type: 'integer' },
    detail: { type: 'string' },
    instance: { type: 'string' },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          code: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
};

export const transactionRequestSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: [
    'transactionId',
    'cardId',
    'clientId',
    'occurredAt',
    'amount',
    'currency',
    'merchantId',
    'mcc',
    'city',
    'latitude',
    'longitude',
    'channel',
    'response',
  ],
  properties: {
    transactionId: { type: 'string', minLength: 1, maxLength: 100, example: 'T00044999' },
    cardId: { type: 'string', minLength: 1, maxLength: 100, example: 'K000643' },
    clientId: { type: 'string', minLength: 1, maxLength: 100, example: 'C00426' },
    occurredAt: { ...dateTime, example: '2026-03-01T02:00:50.000Z' },
    amount: { type: 'integer', minimum: 1, example: 102184 },
    currency: { type: 'string', minLength: 3, maxLength: 3, example: 'UZS' },
    merchantId: { type: 'string', minLength: 1, maxLength: 100, example: 'M00140' },
    mcc: { type: 'string', pattern: '^\\d{4}$', example: '4814' },
    city: { type: 'string', minLength: 1, maxLength: 50, example: 'Samarqand' },
    latitude: { type: 'number', minimum: -90, maximum: 90, example: 39.654 },
    longitude: { type: 'number', minimum: -180, maximum: 180, example: 66.959 },
    channel: { type: 'string', enum: ['ATM', 'ECOM', 'P2P', 'POS'] },
    response: { type: 'string', enum: ['OK', 'DECLINED'] },
  },
};

const signalSchema: SchemaObject = {
  type: 'object',
  required: ['code', 'score', 'message', 'evidence'],
  properties: {
    code: {
      type: 'string',
      enum: ['VELOCITY', 'IMPOSSIBLE_TRAVEL', 'AMOUNT_ANOMALY', 'CARD_TESTING', 'COLD_START'],
    },
    score: { type: 'integer', minimum: 0, maximum: 100 },
    message: { type: 'string' },
    evidence: { type: 'object', additionalProperties: true },
  },
};

export const scoreResponseSchema: SchemaObject = {
  type: 'object',
  required: [
    'transactionId',
    'decisionId',
    'alertId',
    'challengeId',
    'riskScore',
    'action',
    'signals',
    'ruleVersion',
    'processingTimeMs',
  ],
  properties: {
    transactionId: { type: 'string', example: 'T00044999' },
    decisionId: uuid,
    alertId: { ...uuid, nullable: true },
    challengeId: { ...uuid, nullable: true },
    riskScore: { type: 'integer', minimum: 0, maximum: 100 },
    action: { type: 'string', enum: ['APPROVE', 'STEP_UP', 'BLOCK'] },
    signals: { type: 'array', items: signalSchema },
    ruleVersion: { type: 'string', example: 'v1' },
    processingTimeMs: { type: 'number', minimum: 0 },
  },
};

export const replayJobSchema: SchemaObject = {
  type: 'object',
  required: [
    'id',
    'status',
    'totalRows',
    'processedRows',
    'alertsCreated',
    'errorMessage',
    'createdAt',
    'startedAt',
    'completedAt',
  ],
  properties: {
    id: uuid,
    status: { type: 'string', enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'] },
    totalRows: { type: 'integer', minimum: 0 },
    processedRows: { type: 'integer', minimum: 0 },
    alertsCreated: { type: 'integer', minimum: 0 },
    errorMessage: { type: 'string', nullable: true },
    createdAt: dateTime,
    startedAt: { ...dateTime, nullable: true },
    completedAt: { ...dateTime, nullable: true },
  },
};

const alertListItemSchema: SchemaObject = {
  type: 'object',
  required: [
    'id',
    'transactionId',
    'clientId',
    'clientName',
    'amount',
    'currency',
    'merchantName',
    'city',
    'riskScore',
    'status',
    'action',
    'signalCodes',
    'occurredAt',
    'createdAt',
  ],
  properties: {
    id: uuid,
    transactionId: { type: 'string' },
    clientId: { type: 'string' },
    clientName: { type: 'string' },
    amount: { type: 'integer' },
    currency: { type: 'string' },
    merchantName: { type: 'string' },
    city: { type: 'string' },
    riskScore: { type: 'integer', minimum: 0, maximum: 100 },
    status: { type: 'string', enum: ['OPEN', 'CONFIRMED', 'FALSE_POSITIVE', 'CLOSED'] },
    action: { type: 'string', enum: ['APPROVE', 'STEP_UP', 'BLOCK'] },
    signalCodes: { type: 'array', items: { type: 'string' } },
    occurredAt: dateTime,
    createdAt: dateTime,
  },
};

export const alertPageSchema: SchemaObject = {
  type: 'object',
  required: ['items', 'nextCursor'],
  properties: {
    items: { type: 'array', items: alertListItemSchema },
    nextCursor: { type: 'string', nullable: true },
  },
};

export const alertDetailSchema: SchemaObject = {
  allOf: [
    alertListItemSchema,
    {
      type: 'object',
      required: [
        'cardId',
        'channel',
        'response',
        'mcc',
        'latitude',
        'longitude',
        'ruleVersion',
        'signals',
        'caseId',
        'caseStatus',
        'customerVerification',
      ],
      properties: {
        cardId: { type: 'string' },
        channel: { type: 'string', enum: ['ATM', 'ECOM', 'P2P', 'POS'] },
        response: { type: 'string', enum: ['OK', 'DECLINED'] },
        mcc: { type: 'string' },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        ruleVersion: { type: 'string' },
        signals: { type: 'array', items: signalSchema },
        caseId: { ...uuid, nullable: true },
        caseStatus: {
          type: 'string',
          enum: ['OPEN', 'INVESTIGATING', 'CONFIRMED', 'FALSE_POSITIVE', 'CLOSED'],
          nullable: true,
        },
        customerVerification: {
          type: 'object',
          nullable: true,
          required: [
            'challengeId',
            'status',
            'expiresAt',
            'respondedAt',
            'customerDecision',
            'resolution',
            'checks',
          ],
          properties: {
            challengeId: uuid,
            status: {
              type: 'string',
              enum: ['PENDING', 'VERIFIED', 'DENIED', 'REVIEW_REQUIRED', 'EXPIRED'],
            },
            expiresAt: dateTime,
            respondedAt: { ...dateTime, nullable: true },
            customerDecision: { type: 'string', enum: ['CONFIRM', 'DENY'], nullable: true },
            resolution: { type: 'string', enum: ['ALLOW', 'BLOCK', 'REVIEW'], nullable: true },
            checks: {
              type: 'object',
              nullable: true,
              properties: {
                locationMatch: { type: 'boolean' },
                timezoneMatch: { type: 'boolean' },
                clockMatch: { type: 'boolean' },
                clockSkewSeconds: { type: 'integer' },
                distanceKm: { type: 'number' },
              },
            },
          },
        },
      },
    },
  ],
};

export const openCaseRequestSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  properties: { note: { type: 'string', minLength: 1, maxLength: 2_000 } },
};

export const updateCaseRequestSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    status: {
      type: 'string',
      enum: ['OPEN', 'INVESTIGATING', 'CONFIRMED', 'FALSE_POSITIVE', 'CLOSED'],
    },
    note: { type: 'string', minLength: 1, maxLength: 2_000 },
  },
};

export const investigationCaseSchema: SchemaObject = {
  type: 'object',
  required: ['id', 'alertId', 'status', 'note', 'openedAt', 'closedAt', 'updatedAt', 'events'],
  properties: {
    id: uuid,
    alertId: uuid,
    status: {
      type: 'string',
      enum: ['OPEN', 'INVESTIGATING', 'CONFIRMED', 'FALSE_POSITIVE', 'CLOSED'],
    },
    note: { type: 'string', nullable: true },
    openedAt: dateTime,
    closedAt: { ...dateTime, nullable: true },
    updatedAt: dateTime,
    events: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'eventType', 'payload', 'createdAt'],
        properties: {
          id: { type: 'integer' },
          eventType: { type: 'string', enum: ['CASE_OPENED', 'STATUS_CHANGED', 'NOTE_ADDED'] },
          payload: { type: 'object', additionalProperties: true },
          createdAt: dateTime,
        },
      },
    },
  },
};

export const healthSchema: SchemaObject = {
  type: 'object',
  required: ['status', 'info', 'error', 'details'],
  properties: {
    status: { type: 'string', enum: ['ok', 'error'] },
    info: { type: 'object', additionalProperties: true },
    error: { type: 'object', additionalProperties: true },
    details: { type: 'object', additionalProperties: true },
  },
};

const customerChallengeSummarySchema: SchemaObject = {
  type: 'object',
  required: [
    'id',
    'status',
    'merchantName',
    'amount',
    'currency',
    'occurredAt',
    'city',
    'channel',
    'expiresAt',
  ],
  properties: {
    id: uuid,
    status: {
      type: 'string',
      enum: ['PENDING', 'VERIFIED', 'DENIED', 'REVIEW_REQUIRED', 'EXPIRED'],
    },
    merchantName: { type: 'string' },
    amount: { type: 'integer', minimum: 1 },
    currency: { type: 'string', minLength: 3, maxLength: 3 },
    occurredAt: dateTime,
    city: { type: 'string' },
    channel: { type: 'string', enum: ['ATM', 'ECOM', 'P2P', 'POS'] },
    expiresAt: dateTime,
  },
};

export const customerChallengePageSchema: SchemaObject = {
  type: 'object',
  required: ['items'],
  properties: { items: { type: 'array', items: customerChallengeSummarySchema } },
};

export const customerChallengeDetailSchema: SchemaObject = {
  allOf: [
    customerChallengeSummarySchema,
    {
      type: 'object',
      required: ['transactionId'],
      properties: { transactionId: { type: 'string', minLength: 1, maxLength: 100 } },
    },
  ],
};

export const customerChallengeResponseRequestSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['decision', 'deviceTimestamp', 'location', 'timezone'],
  properties: {
    decision: { type: 'string', enum: ['CONFIRM', 'DENY'] },
    deviceTimestamp: dateTime,
    location: {
      type: 'object',
      additionalProperties: false,
      required: ['latitude', 'longitude', 'accuracyMeters'],
      properties: {
        latitude: { type: 'number', minimum: -90, maximum: 90 },
        longitude: { type: 'number', minimum: -180, maximum: 180 },
        accuracyMeters: { type: 'number', exclusiveMinimum: true, minimum: 0, maximum: 50_000 },
      },
    },
    timezone: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'utcOffsetMinutes'],
      properties: {
        name: { type: 'string', example: 'Asia/Tashkent' },
        utcOffsetMinutes: { type: 'integer', minimum: -840, maximum: 840, example: 300 },
      },
    },
  },
};

export const customerChallengeResponseSchema: SchemaObject = {
  type: 'object',
  required: ['challengeId', 'status', 'resolution', 'checks', 'respondedAt'],
  properties: {
    challengeId: uuid,
    status: { type: 'string', enum: ['VERIFIED', 'DENIED', 'REVIEW_REQUIRED'] },
    resolution: { type: 'string', enum: ['ALLOW', 'BLOCK', 'REVIEW'] },
    checks: {
      type: 'object',
      required: ['locationMatch', 'timezoneMatch', 'clockMatch', 'clockSkewSeconds', 'distanceKm'],
      properties: {
        locationMatch: { type: 'boolean' },
        timezoneMatch: { type: 'boolean' },
        clockMatch: { type: 'boolean' },
        clockSkewSeconds: { type: 'integer', minimum: 0 },
        distanceKm: { type: 'number', minimum: 0 },
      },
    },
    respondedAt: dateTime,
  },
};

const operatorTransactionItemSchema: SchemaObject = {
  type: 'object',
  required: [
    'transactionId',
    'cardId',
    'clientId',
    'clientName',
    'merchantId',
    'merchantName',
    'amount',
    'currency',
    'occurredAt',
    'city',
    'channel',
    'response',
    'mcc',
    'riskScore',
    'action',
    'signalCodes',
    'alertId',
    'alertStatus',
    'customerVerificationStatus',
  ],
  properties: {
    transactionId: { type: 'string', minLength: 1, maxLength: 100 },
    cardId: { type: 'string', minLength: 1, maxLength: 100 },
    clientId: { type: 'string', minLength: 1, maxLength: 100 },
    clientName: { type: 'string' },
    merchantId: { type: 'string', minLength: 1, maxLength: 100 },
    merchantName: { type: 'string' },
    amount: { type: 'integer', minimum: 1 },
    currency: { type: 'string' },
    occurredAt: dateTime,
    city: { type: 'string' },
    channel: { type: 'string', enum: ['ATM', 'ECOM', 'P2P', 'POS'] },
    response: { type: 'string', enum: ['OK', 'DECLINED'] },
    mcc: { type: 'string' },
    riskScore: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
    action: { type: 'string', enum: ['APPROVE', 'STEP_UP', 'BLOCK'], nullable: true },
    signalCodes: { type: 'array', items: { type: 'string' } },
    alertId: { ...uuid, nullable: true },
    alertStatus: {
      type: 'string',
      enum: ['OPEN', 'CONFIRMED', 'FALSE_POSITIVE', 'CLOSED'],
      nullable: true,
    },
    customerVerificationStatus: {
      type: 'string',
      enum: ['PENDING', 'VERIFIED', 'DENIED', 'REVIEW_REQUIRED', 'EXPIRED'],
      nullable: true,
    },
  },
};

export const operatorTransactionPageSchema: SchemaObject = {
  type: 'object',
  required: ['items', 'nextCursor'],
  properties: {
    items: { type: 'array', items: operatorTransactionItemSchema },
    nextCursor: { type: 'string', nullable: true },
  },
};

export const operatorTransactionDetailSchema: SchemaObject = {
  allOf: [
    operatorTransactionItemSchema,
    {
      type: 'object',
      required: [
        'latitude',
        'longitude',
        'merchantCategory',
        'merchantCity',
        'merchantRiskLevel',
        'ruleVersion',
        'signals',
        'caseId',
        'caseStatus',
        'customerVerification',
      ],
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        merchantCategory: { type: 'string' },
        merchantCity: { type: 'string' },
        merchantRiskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
        ruleVersion: { type: 'string', nullable: true },
        signals: { type: 'array', items: signalSchema },
        caseId: { ...uuid, nullable: true },
        caseStatus: {
          type: 'string',
          enum: ['OPEN', 'INVESTIGATING', 'CONFIRMED', 'FALSE_POSITIVE', 'CLOSED'],
          nullable: true,
        },
        customerVerification: { type: 'object', nullable: true, additionalProperties: true },
      },
    },
  ],
};

const customerTransactionItemSchema: SchemaObject = {
  type: 'object',
  required: [
    'transactionId',
    'merchantName',
    'amount',
    'currency',
    'occurredAt',
    'city',
    'channel',
    'response',
    'verificationStatus',
  ],
  properties: {
    transactionId: { type: 'string', minLength: 1, maxLength: 100 },
    merchantName: { type: 'string' },
    amount: { type: 'integer', minimum: 1 },
    currency: { type: 'string' },
    occurredAt: dateTime,
    city: { type: 'string' },
    channel: { type: 'string', enum: ['ATM', 'ECOM', 'P2P', 'POS'] },
    response: { type: 'string', enum: ['OK', 'DECLINED'] },
    verificationStatus: {
      type: 'string',
      enum: ['PENDING', 'VERIFIED', 'DENIED', 'REVIEW_REQUIRED', 'EXPIRED'],
      nullable: true,
    },
  },
};

export const customerTransactionPageSchema: SchemaObject = {
  type: 'object',
  required: ['items', 'nextCursor'],
  properties: {
    items: { type: 'array', items: customerTransactionItemSchema },
    nextCursor: { type: 'string', nullable: true },
  },
};

export const customerTransactionDetailSchema: SchemaObject = {
  allOf: [
    customerTransactionItemSchema,
    {
      type: 'object',
      required: [
        'cardId',
        'merchantCategory',
        'merchantCity',
        'mcc',
        'latitude',
        'longitude',
        'verification',
      ],
      properties: {
        cardId: { type: 'string' },
        merchantCategory: { type: 'string' },
        merchantCity: { type: 'string' },
        mcc: { type: 'string' },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        verification: { type: 'object', nullable: true, additionalProperties: true },
      },
    },
  ],
};

const customerCardItemSchema: SchemaObject = {
  type: 'object',
  required: ['cardId', 'type', 'currency', 'openedAt', 'dailyLimit'],
  properties: {
    cardId: { type: 'string', minLength: 1, maxLength: 100 },
    type: { type: 'string', enum: ['UZCARD', 'HUMO', 'VISA', 'MASTERCARD'] },
    currency: { type: 'string', minLength: 3, maxLength: 3 },
    openedAt: { type: 'string', format: 'date' },
    dailyLimit: { type: 'integer', minimum: 1 },
  },
};

export const customerCardPageSchema: SchemaObject = {
  type: 'object',
  required: ['items', 'nextCursor'],
  properties: {
    items: { type: 'array', items: customerCardItemSchema },
    nextCursor: { type: 'string', nullable: true },
  },
};

export const operatorCardPageSchema: SchemaObject = {
  type: 'object',
  required: ['items', 'nextCursor'],
  properties: {
    items: {
      type: 'array',
      items: {
        allOf: [
          customerCardItemSchema,
          {
            type: 'object',
            required: ['clientId', 'clientName'],
            properties: {
              clientId: { type: 'string', minLength: 1, maxLength: 100 },
              clientName: { type: 'string' },
            },
          },
        ],
      },
    },
    nextCursor: { type: 'string', nullable: true },
  },
};
