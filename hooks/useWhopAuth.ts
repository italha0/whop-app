'use client';

import React from 'react';

type WhopUser = {
	id: string;
	username?: string | null;
	email?: string | null;
	profile_picture_url?: string | null;
};

export function useWhopAuth() {
	const [data, setData] = React.useState<WhopUser | null>(null);
	const [isLoading, setIsLoading] = React.useState(true);

	React.useEffect(() => {
		let cancelled = false;
		async function run() {
			try {
				const res = await fetch('/api/me', { credentials: 'include' });
				if (!res.ok) return;
				const json = await res.json();
				if (!cancelled) setData(json?.user ?? null);
			} catch (_) {
				// ignore
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}
		run();
		return () => {
			cancelled = true;
		};
	}, []);

	return { data, isLoading } as const;
}

export function WhopProvider({ children }: { children: React.ReactNode }) {
	return children as React.ReactElement;
}