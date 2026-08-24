import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ChallengeResponseRecord,
  SECURITY_CHALLENGE_REPOSITORY,
  SecurityChallengeRepository,
  SecurityChallengeSummary,
} from '../../application/ports/security-challenge.repository';
import { evaluateDeviceContext } from '../../domain/services/customer-verification';
import { RespondToSecurityChallengeDto } from './dto/security-challenge.dto';

export interface CustomerChallengePage {
  items: readonly SecurityChallengeSummary[];
}

export interface CustomerChallengeDetail extends SecurityChallengeSummary {
  transactionId: string;
}

@Injectable()
export class CustomerSecurityService {
  constructor(
    @Inject(SECURITY_CHALLENGE_REPOSITORY)
    private readonly challenges: SecurityChallengeRepository,
  ) {}

  async list(clientId: string): Promise<CustomerChallengePage> {
    return { items: await this.challenges.listForClient(clientId) };
  }

  async detail(id: string, clientId: string): Promise<CustomerChallengeDetail> {
    const challenge = await this.challenges.findForClient(id, clientId);
    if (!challenge) throw new NotFoundException(`Security challenge ${id} was not found`);
    return {
      id: challenge.id,
      status: challenge.status,
      merchantName: challenge.merchantName,
      amount: challenge.amount,
      currency: challenge.currency,
      occurredAt: challenge.occurredAt,
      city: challenge.city,
      channel: challenge.channel,
      expiresAt: challenge.expiresAt,
      transactionId: challenge.transactionId,
    };
  }

  async respond(
    id: string,
    clientId: string,
    idempotencyKey: string,
    body: RespondToSecurityChallengeDto,
  ): Promise<ChallengeResponseRecord> {
    const challenge = await this.challenges.findForClient(id, clientId);
    if (!challenge) throw new NotFoundException(`Security challenge ${id} was not found`);

    const checks = evaluateDeviceContext({
      transactionLatitude: challenge.transactionLatitude,
      transactionLongitude: challenge.transactionLongitude,
      deviceLatitude: body.location.latitude,
      deviceLongitude: body.location.longitude,
      accuracyMeters: body.location.accuracyMeters,
      timezoneName: body.timezone.name,
      utcOffsetMinutes: body.timezone.utcOffsetMinutes,
      deviceTimestamp: new Date(body.deviceTimestamp),
      receivedAt: new Date(),
    });
    const coherent = checks.locationMatch && checks.timezoneMatch && checks.clockMatch;
    const outcome =
      body.decision === 'DENY'
        ? { status: 'DENIED' as const, resolution: 'BLOCK' as const }
        : coherent
          ? { status: 'VERIFIED' as const, resolution: 'ALLOW' as const }
          : { status: 'REVIEW_REQUIRED' as const, resolution: 'REVIEW' as const };

    const result = await this.challenges.saveResponse({
      challengeId: id,
      clientId,
      idempotencyKey,
      decision: body.decision,
      latitude: body.location.latitude,
      longitude: body.location.longitude,
      accuracyMeters: body.location.accuracyMeters,
      timezoneName: body.timezone.name,
      utcOffsetMinutes: body.timezone.utcOffsetMinutes,
      deviceTimestamp: new Date(body.deviceTimestamp),
      status: outcome.status,
      resolution: outcome.resolution,
      checks,
    });

    if (result.kind === 'not-found') {
      throw new NotFoundException(`Security challenge ${id} was not found`);
    }
    if (result.kind === 'expired') {
      throw new ConflictException(`Security challenge ${id} has expired`);
    }
    if (result.kind === 'already-responded') {
      throw new ConflictException({
        message: `Security challenge ${id} already has a different response`,
        current: result.value,
      });
    }
    return result.value;
  }
}
