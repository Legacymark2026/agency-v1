import {
  DiscountTableProps,
  HistoricalSalePoint,
  MLForecastResult,
  ScenarioSimulationProps,
  ScenarioSimulationResult
} from "../domain/sales-forecast.domain";

export interface ISalesForecastRepositoryPort {
  // Discount Tables
  createDiscountTable(table: Omit<DiscountTableProps, "id">): Promise<DiscountTableProps>;
  listDiscountTables(companyId: string): Promise<DiscountTableProps[]>;
  getDiscountTableByCode(companyId: string, code: string): Promise<DiscountTableProps | null>;
  toggleDiscountTable(id: string, isActive: boolean): Promise<DiscountTableProps>;

  // Historical Sales
  getHistoricalSales(companyId: string, productId?: string, months?: number): Promise<HistoricalSalePoint[]>;

  // Forecast Records
  saveForecastRecord(forecast: MLForecastResult & { companyId: string }): Promise<any>;
  listForecasts(companyId: string, period?: string): Promise<any[]>;

  // Scenarios
  saveSimulation(simulation: {
    companyId: string;
    name: string;
    scenarioType: string;
    result: ScenarioSimulationResult;
    params: ScenarioSimulationProps;
  }): Promise<any>;
  listSimulations(companyId: string): Promise<any[]>;
}

export interface ISalesForecastEventPublisherPort {
  publishForecastGenerated(payload: { companyId: string; period: string; totalRevenueProjected: number }): Promise<void>;
  publishDiscountTableChanged(payload: { companyId: string; tableCode: string; action: string }): Promise<void>;
  publishScenarioSimulated(payload: { companyId: string; scenarioName: string; isViable: boolean }): Promise<void>;
}

export interface ISalesForecastUseCases {
  evaluateDiscount(params: {
    companyId: string;
    tableCode: string;
    quantity: number;
    baseUnitPrice: number;
    unitCost: number;
  }): Promise<any>;
  runMLSalesForecast(params: { companyId: string; targetPeriod: string; productId?: string }): Promise<MLForecastResult[]>;
  simulateCommercialScenario(params: ScenarioSimulationProps & { companyId: string }): Promise<ScenarioSimulationResult>;
}
