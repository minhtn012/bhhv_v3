/**
 * BHV Vehicle Data Mapper
 * Re-exports from the original bhvDataMapper for backward compatibility
 * All mapping functions are preserved from the original implementation
 */

export {
  mapInsuranceOptions,
  mapVehicleGoal,
  getKindConfig,
  mapCarWeightGoods,
  mapCarAutomaker,
  mapCarModel,
  mapCarBodyStyle,
  mapCarModelYear,
  mapCarSeat,
  mapCarPackage,
  mapCarTypeEngine,
  mapCarDeduction,
  mapCarKind,
  mapInsuranceTypeOptions,
  processFractionalPart,
  calculateRequestChangeFees,
  transformContractToBhvConfirmFormat,
  transformContractToBhvFormat,
  transformContractToPremiumCheckFormat,
} from '@/lib/bhvDataMapper';
