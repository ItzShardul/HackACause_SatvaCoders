const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchAPI(endpoint: string, options?: RequestInit) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
}

export const api = {
    // Dashboard
    getDashboardOverview: () => fetchAPI("/api/dashboard/overview"),

    // Villages
    getVillages: (params?: { district?: string; severity?: string }) => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return fetchAPI(`/api/villages${query ? `?${query}` : ""}`);
    },
    getVillageDetail: (id: number) => fetchAPI(`/api/villages/${id}`),

    // Predictions
    getPredictions: (daysAhead = 30) => fetchAPI(`/api/predictions?days_ahead=${daysAhead}`),
    getDistrictSummary: (daysAhead = 30) => fetchAPI(`/api/predictions/district-summary?days_ahead=${daysAhead}`),

    // Tankers
    getTankers: () => fetchAPI("/api/tankers"),

    // Allocation
    getPriorities: (limit = 20) => fetchAPI(`/api/allocation/priorities?limit=${limit}`),
    autoAllocate: () => fetchAPI("/api/allocation/auto-allocate", { method: "POST" }),

    // Routes
    optimizeRoutes: (district?: string, numVehicles = 3) => {
        const params = new URLSearchParams({ num_vehicles: String(numVehicles) });
        if (district) params.set("district", district);
        return fetchAPI(`/api/routes/optimize?${params}`, { method: "POST" });
    },

    // Simulation
    simulate: (rainfallChangePct: number) =>
        fetchAPI(`/api/simulate?rainfall_change_pct=${rainfallChangePct}`, { method: "POST" }),

    // Requests
    getRequests: (params?: { status?: string; village_id?: number }) => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return fetchAPI(`/api/requests${query ? `?${query}` : ""}`);
    },
    createRequest: (data: any) => {
        const params = new URLSearchParams(data).toString();
        return fetchAPI(`/api/requests?${params}`, { method: "POST" });
    },

    // Grievances
    getGrievances: (status?: string) => {
        const query = status ? `?status=${status}` : "";
        return fetchAPI(`/api/grievances${query}`);
    },
    createGrievance: (data: any) => {
        const params = new URLSearchParams(data).toString();
        return fetchAPI(`/api/grievances?${params}`, { method: "POST" });
    },

    // Districts
    getDistricts: () => fetchAPI("/api/districts"),

    // Trips
    getTrips: (status?: string) => {
        const query = status ? `?status=${status}` : "";
        return fetchAPI(`/api/trips${query}`);
    },

    // Auth
    login: (email: string, password: string) =>
        fetchAPI(`/api/auth/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, { method: "POST" }),
};
