import { useState, useEffect } from 'react';
import { CarSelection, CarRecord, CarSearchResult } from '@/types/car';

interface ExtractedData {
  nhanHieu?: string;
  soLoai?: string;
}

interface VehicleData {
  tenXe: string;
  nhanHieu: string;
  soLoai: string;
  kieuDang: string;
  namPhienBan: string;
}

interface UseCarSelectionProps {
  onVehicleDataChange?: (vehicleData: VehicleData) => void;
}

export default function useCarSelection(props?: UseCarSelectionProps) {
  const [carData, setCarData] = useState<CarSelection>({
    suggestedCar: null,
    selectedBrand: '',
    selectedModel: '',
    selectedBodyStyle: '',
    selectedYear: 'Khác',
    availableBrands: [],
    availableModels: [],
    availableBodyStyles: [],
    availableYears: [],
    isLoadingModels: false,
    isLoadingDetails: false
  });

  // Generate vehicle data from car selection
  const generateVehicleData = (selection: CarSelection): VehicleData => {
    const { selectedBrand, selectedModel, selectedBodyStyle, selectedYear } = selection;
    
    // Generate tenXe (complete vehicle name)
    let tenXe = '';
    if (selectedBrand) {
      tenXe = selectedBrand;
      if (selectedModel) {
        tenXe += ` ${selectedModel}`;
        if (selectedBodyStyle) {
          tenXe += ` ${selectedBodyStyle}`;
        }
        if (selectedYear && selectedYear !== 'Khác') {
          tenXe += ` ${selectedYear}`;
        }
      }
    }
    
    return {
      tenXe: tenXe.trim(),
      nhanHieu: selectedBrand,
      soLoai: selectedModel,
      kieuDang: selectedBodyStyle,
      namPhienBan: selectedYear
    };
  };

  // Call callback when vehicle data changes
  const notifyVehicleDataChange = (newCarData: CarSelection) => {
    if (props?.onVehicleDataChange) {
      const vehicleData = generateVehicleData(newCarData);
      props.onVehicleDataChange(vehicleData);
    }
  };

  // Load all brands on component mount
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const response = await fetch('/api/car-search/brands');
        const result = await response.json();
        
        if (result.success) {
          setCarData(prev => ({ ...prev, availableBrands: result.data }));
        } else {
          console.error('Error loading brands:', result.error);
        }
      } catch (error) {
        console.error('Error loading brands:', error);
      }
    };
    loadBrands();
  }, []);

  const handleInputChange = (field: keyof CarSelection, value: any) => {
    const newCarData = { ...carData, [field]: value };
    setCarData(newCarData);
    
    // Notify when vehicle identification fields change
    if (['selectedBrand', 'selectedModel', 'selectedBodyStyle', 'selectedYear'].includes(field)) {
      notifyVehicleDataChange(newCarData);
    }
  };

  const handleBrandChange = async (brandName: string) => {
    const newCarData = { 
      ...carData, 
      selectedBrand: brandName,
      selectedModel: '',
      selectedBodyStyle: '',
      selectedYear: 'Khác',
      availableModels: [],
      availableBodyStyles: [],
      availableYears: [],
      isLoadingModels: true
    };
    
    setCarData(newCarData);
    notifyVehicleDataChange(newCarData);

    try {
      const response = await fetch(`/api/car-search/models/${encodeURIComponent(brandName)}`);
      const result = await response.json();
      
      if (result.success) {
        const updatedCarData = { 
          ...newCarData, 
          availableModels: result.data,
          isLoadingModels: false
        };
        setCarData(updatedCarData);
      } else {
        console.error('Error loading models:', result.error);
        setCarData({ 
          ...newCarData, 
          isLoadingModels: false
        });
      }
    } catch (error) {
      console.error('Error loading models:', error);
      setCarData({ 
        ...newCarData, 
        isLoadingModels: false
      });
    }
  };

  const handleModelChange = async (modelName: string) => {
    const newCarData = { 
      ...carData, 
      selectedModel: modelName,
      selectedBodyStyle: '',
      selectedYear: 'Khác',
      availableBodyStyles: [],
      availableYears: [],
      isLoadingDetails: true
    };
    
    setCarData(newCarData);
    notifyVehicleDataChange(newCarData);

    try {
      const response = await fetch(
        `/api/car-search/details/${encodeURIComponent(carData.selectedBrand)}/${encodeURIComponent(modelName)}`
      );
      const result = await response.json();
      
      if (result.success) {
        const updatedCarData = { 
          ...newCarData, 
          availableBodyStyles: result.data.bodyStyles,
          availableYears: result.data.years || [],
          selectedBodyStyle: result.data.bodyStyles[0]?.name || '',
          selectedYear: result.data.years[0]?.name || '',
          isLoadingDetails: false
        };
        setCarData(updatedCarData);
        notifyVehicleDataChange(updatedCarData);
      } else {
        console.error('Error loading car details:', result.error);
        setCarData({ 
          ...newCarData, 
          isLoadingDetails: false
        });
      }
    } catch (error) {
      console.error('Error loading car details:', error);
      setCarData({ 
        ...newCarData, 
        isLoadingDetails: false
      });
    }
  };

  const acceptSuggestedCar = async () => {
    if (carData.suggestedCar) {
      const car = carData.suggestedCar;
      
      try {
        const modelsResponse = await fetch(`/api/car-search/models/${encodeURIComponent(car.brand_name)}`);
        const modelsResult = await modelsResponse.json();
        
        const allModels = modelsResult.success ? modelsResult.data : [car];
        
        const updatedCarData = {
          ...carData,
          selectedBrand: car.brand_name,
          selectedModel: car.model_name,
          selectedBodyStyle: car.body_styles?.[0]?.name || '',
          selectedYear: car.years?.[0]?.name || '',
          availableModels: allModels,
          availableBodyStyles: car.body_styles || [],
          availableYears: car.years || []
        };
        setCarData(updatedCarData);
        notifyVehicleDataChange(updatedCarData);
      } catch (error) {
        console.error('Error loading all models:', error);
        const fallbackCarData = {
          ...carData,
          selectedBrand: car.brand_name,
          selectedModel: car.model_name,
          selectedBodyStyle: car.body_styles?.[0]?.name || '',
          selectedYear: car.years?.[0]?.name || '',
          availableModels: [car],
          availableBodyStyles: car.body_styles || [],
          availableYears: car.years || []
        };
        setCarData(fallbackCarData);
        notifyVehicleDataChange(fallbackCarData);
      }
    }
  };

  const searchCarFromExtractedData = async (data: ExtractedData) => {
    if (!data.nhanHieu) return;

    try {
      const brandName = data.nhanHieu;
      const modelName = data.soLoai;
      
      const response = await fetch('/api/car-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName, modelName })
      });

      const result = await response.json();
      
      if (!result.success) {
        console.error('Car search error:', result.error);
        return;
      }

      const searchResults: CarSearchResult = result.data;
      
      let suggestedCar: CarRecord | null = null;
      
      if (searchResults.exactMatch) {
        suggestedCar = searchResults.exactMatch;
      } else if (searchResults.prefixMatch) {
        suggestedCar = searchResults.prefixMatch;
      } else if (searchResults.textSearch.length > 0) {
        suggestedCar = searchResults.textSearch[0];
      }

      if (suggestedCar) {
        const modelsResponse = await fetch(`/api/car-search/models/${encodeURIComponent(suggestedCar.brand_name)}`);
        const modelsResult = await modelsResponse.json();
        
        const allModels = modelsResult.success ? modelsResult.data : [suggestedCar];
        
        const updatedCarData = {
          ...carData,
          suggestedCar,
          selectedBrand: suggestedCar.brand_name,
          selectedModel: suggestedCar.model_name,
          availableModels: allModels,
          availableBodyStyles: suggestedCar.body_styles || [],
          availableYears: suggestedCar.years || [],
          selectedBodyStyle: suggestedCar.body_styles?.[0]?.name || '',
          selectedYear: suggestedCar.years?.[0]?.name || ''
        };
        setCarData(updatedCarData);
        notifyVehicleDataChange(updatedCarData);
      }

    } catch (error) {
      console.error('Error searching car:', error);
    }
  };

  const initializeFromExistingContract = async (contractData: {
    carBrand?: string;
    carModel?: string;
    carBodyStyle?: string;
    carYear?: string;
  }) => {
    if (!contractData.carBrand || !contractData.carModel) {
      return;
    }

    try {
      // Set loading state
      setCarData(prev => ({ 
        ...prev, 
        isLoadingModels: true, 
        isLoadingDetails: true 
      }));

      // Step 1: Load models for the brand
      const modelsResponse = await fetch(`/api/car-search/models/${encodeURIComponent(contractData.carBrand)}`);
      const modelsResult = await modelsResponse.json();
      
      if (!modelsResult.success) {
        throw new Error('Failed to load models');
      }

      // Step 2: Load details for the specific model
      const detailsResponse = await fetch(
        `/api/car-search/details/${encodeURIComponent(contractData.carBrand)}/${encodeURIComponent(contractData.carModel)}`
      );
      const detailsResult = await detailsResponse.json();
      
      if (!detailsResult.success) {
        throw new Error('Failed to load car details');
      }

      // Step 3: Set all data at once
      const updatedCarData = {
        ...carData,
        selectedBrand: contractData.carBrand!,
        selectedModel: contractData.carModel!,
        selectedBodyStyle: contractData.carBodyStyle || '',
        selectedYear: contractData.carYear || '',
        availableModels: modelsResult.data,
        availableBodyStyles: detailsResult.data.bodyStyles || [],
        availableYears: detailsResult.data.years || [],
        isLoadingModels: false,
        isLoadingDetails: false
      };
      setCarData(updatedCarData);
      notifyVehicleDataChange(updatedCarData);

    } catch (error) {
      console.error('Error initializing car data from contract:', error);
      setCarData(prev => ({
        ...prev,
        isLoadingModels: false,
        isLoadingDetails: false
      }));
    }
  };

  return {
    carData,
    handleInputChange,
    handleBrandChange,
    handleModelChange,
    acceptSuggestedCar,
    searchCarFromExtractedData,
    initializeFromExistingContract
  };
}