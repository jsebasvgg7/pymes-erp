import { createContext, useMemo, useState } from "react";

export type AppContextValue = {
	tenantId: string | null;
	setTenantId: (value: string | null) => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
	const [tenantId, setTenantId] = useState<string | null>(null);

	const value = useMemo<AppContextValue>(() => ({ tenantId, setTenantId }), [tenantId]);

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

