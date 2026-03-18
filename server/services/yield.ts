export interface YieldInsights {
  utilization: number;
  recommendedMultiplier: number;
  marketDemandFactor: number;
  projectedRevenueUplift: string;
}

export function calculateYield(
  totalVehicles: number,
  activeBookings: number,
): YieldInsights {
  const utilization = totalVehicles > 0 ? activeBookings / totalVehicles : 0;

  // High utilization = higher prices (Yield Management)
  let multiplier = 1.0;
  if (utilization < 0.2) multiplier = 0.9;
  else if (utilization > 0.6 && utilization <= 0.8) multiplier = 1.2;
  else if (utilization > 0.8) multiplier = 1.5;

  // Mock market demand (in a real system, this would fetch from an external API)
  const marketDemandFactor = 1.0 + Math.random() * 0.2;

  const finalMultiplier = multiplier * marketDemandFactor;
  const uplift = ((finalMultiplier - 1.0) * 100).toFixed(1);

  return {
    utilization: Math.round(utilization * 100),
    recommendedMultiplier: Number(finalMultiplier.toFixed(2)),
    marketDemandFactor: Number(marketDemandFactor.toFixed(2)),
    projectedRevenueUplift: uplift + "%",
  };
}
