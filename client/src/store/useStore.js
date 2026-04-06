import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // Session
      sessionId: `session-${Date.now()}`,

      // Budget
      dailyLimit: null,
      totalSpent: 0,
      budgetSet: false,

      setBudget: (limit) =>
        set({ dailyLimit: limit, budgetSet: true }),

      addSpend: (amount) =>
        set((s) => ({ totalSpent: s.totalSpent + amount })),

      // Current profile
      currentProfile: null,
      setCurrentProfile: (profile) => set({ currentProfile: profile }),

      updateProfileResearch: (research) =>
        set((s) => ({
          currentProfile: s.currentProfile
            ? { ...s.currentProfile, research }
            : null,
        })),

      updateProfileAsset: (key, data) =>
        set((s) => ({
          currentProfile: s.currentProfile
            ? {
                ...s.currentProfile,
                assets: { ...s.currentProfile.assets, [key]: data },
              }
            : null,
        })),

      // Profiles list
      profiles: [],
      setProfiles: (profiles) => set({ profiles }),

      // API status
      apiStatus: null,
      setApiStatus: (status) => set({ apiStatus: status }),

      // Navigation state
      currentStep: 'mode-select',
      setStep: (step) => set({ currentStep: step }),

      // Theme
      theme: 'dark',
      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({ theme });
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', next === 'dark');
        set({ theme: next });
      },

      // Autonomous mode
      autonomousMode: false,
      setAutonomousMode: (val) => set({ autonomousMode: val }),

      // Reset
      resetSession: () =>
        set({
          currentProfile: null,
          currentStep: 'mode-select',
          totalSpent: 0,
        }),
    }),
    {
      name: 'brandgen-storage',
      partialize: (state) => ({
        dailyLimit: state.dailyLimit,
        budgetSet: state.budgetSet,
        profiles: state.profiles,
        sessionId: state.sessionId,
        theme: state.theme,
      }),
    }
  )
);
