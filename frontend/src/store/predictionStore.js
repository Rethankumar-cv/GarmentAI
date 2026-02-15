import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const usePredictionStore = create(
    persist(
        (set) => ({
            predictionData: null,
            formData: {
                fabric_type: 'Cotton',
                item_weight: '0.5',
                garment_category: 'Shirts',
                price: '500',
                outlet_id: 1,
                outlet_established_year: 2000,
                outlet_size: 1,
                outlet_location_type: 1,
                outlet_type: 1
            },
            lastRun: null,

            setPredictionData: (data) => set({ predictionData: data, lastRun: new Date().toISOString() }),
            setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
            clearPredictionData: () => set({
                predictionData: null,
                lastRun: null,
                // Optional: Reset formData? User might want to keep it. Let's keep it for now or provide a separate reset.
            }),
            resetAll: () => set({
                predictionData: null,
                lastRun: null,
                formData: {
                    fabric_type: 'Cotton',
                    item_weight: '0.5',
                    garment_category: 'Shirts',
                    price: '500',
                    outlet_id: 1,
                    outlet_established_year: 2000,
                    outlet_size: 1,
                    outlet_location_type: 1,
                    outlet_type: 1
                }
            })
        }),
        {
            name: 'prediction-storage', // name of the item in the storage (must be unique)
        }
    )
);

export default usePredictionStore;
