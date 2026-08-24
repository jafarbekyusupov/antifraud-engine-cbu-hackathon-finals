import { Module } from '@nestjs/common';
import { RISK_STATE_STORE } from '../../application/ports/risk-state-store.port';
import { RISK_ENGINE } from '../../application/replay-transactions/replay-transactions.use-case';
import { RiskEngine } from '../../domain/services/risk-engine';
import { InMemoryRiskStateStore } from '../../infrastructure/state/in-memory-risk-state.store';

@Module({
  providers: [
    {
      provide: RISK_STATE_STORE,
      useClass: InMemoryRiskStateStore,
    },
    {
      provide: RISK_ENGINE,
      useFactory: (): RiskEngine => RiskEngine.createDefault(),
    },
  ],
  exports: [RISK_STATE_STORE, RISK_ENGINE],
})
export class RiskModule {}
