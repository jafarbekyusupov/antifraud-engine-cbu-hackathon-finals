import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import {
  ALERT_QUERY_REPOSITORY,
  AlertDetail,
  AlertListItem,
  AlertQueryRepository,
} from '../../application/ports/alert-query.repository';
import { ListAlertsQueryDto } from './dto';

const cursorSchema = z.strictObject({
  createdAt: z.iso.datetime(),
  id: z.uuid(),
});

export interface AlertPage {
  items: readonly AlertListItem[];
  nextCursor: string | null;
}

@Injectable()
export class AlertQueryService {
  constructor(@Inject(ALERT_QUERY_REPOSITORY) private readonly alerts: AlertQueryRepository) {}

  async list(query: ListAlertsQueryDto): Promise<AlertPage> {
    const rows = await this.alerts.list({
      status: query.status,
      clientId: query.clientId,
      minimumRiskScore: query.minimumRiskScore,
      cursor: query.cursor ? this.decodeCursor(query.cursor) : undefined,
      limit: query.limit + 1,
    });
    const hasMore = rows.length > query.limit;
    const items = hasMore ? rows.slice(0, query.limit) : rows;
    const last = items.at(-1);

    return {
      items,
      nextCursor:
        hasMore && last
          ? Buffer.from(
              JSON.stringify({ createdAt: last.createdAt.toISOString(), id: last.id }),
            ).toString('base64url')
          : null,
    };
  }

  async detail(id: string): Promise<AlertDetail> {
    const alert = await this.alerts.findById(id);
    if (!alert) throw new NotFoundException(`Alert ${id} was not found`);
    return alert;
  }

  private decodeCursor(value: string): { createdAt: Date; id: string } {
    try {
      const parsed = cursorSchema.parse(
        JSON.parse(Buffer.from(value, 'base64url').toString('utf8')),
      );
      return { createdAt: new Date(parsed.createdAt), id: parsed.id };
    } catch {
      throw new BadRequestException('Invalid alert cursor');
    }
  }
}
