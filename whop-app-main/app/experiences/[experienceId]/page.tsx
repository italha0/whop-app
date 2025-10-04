'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { useWhopAuthContext } from '@/components/layout/WhopAuthProvider';
import { Paywall } from '@/components/payment/Paywall';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown, Zap, Star } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ExperiencePage() {
	const params = useParams();
	const experienceId = params.experienceId as string;
	const { user, isAuthenticated, loading: authLoading } = useWhopAuthContext();
	const { hasActiveSubscription, subscription, loading, error, refreshSubscription } = useSubscription();
	const [accessChecked, setAccessChecked] = useState(false);
	const [hasAccess, setHasAccess] = useState(false);

	// Check access to the experience
	useEffect(() => {
		const checkAccess = async () => {
			if (!isAuthenticated || !user) return;
			
			try {
				// In a real implementation, you would check access here
				// For now, we'll assume the user has access if they're authenticated
				setHasAccess(true);
				setAccessChecked(true);
			} catch (error) {
				console.error('Error checking access:', error);
				setHasAccess(false);
				setAccessChecked(true);
			}
		};

		checkAccess();
	}, [isAuthenticated, user, experienceId]);

	const handleUpgrade = () => {
		// Scroll to pricing section or open pricing modal
		window.location.href = '/#pricing';
	};

	if (authLoading || loading || !accessChecked) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
					<p className="text-muted-foreground">
						{authLoading ? 'Authenticating...' : loading ? 'Checking subscription status...' : 'Checking access...'}
					</p>
				</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
					<p className="text-muted-foreground mb-6">
						Please log in to access this experience.
					</p>
					<Button onClick={() => window.location.href = '/'}>
						Go to Home
					</Button>
				</div>
			</div>
		);
	}

	if (!hasAccess) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">Access Denied</h1>
					<p className="text-muted-foreground mb-6">
						You don't have access to this experience.
					</p>
					<Button onClick={() => window.location.href = '/'}>
						Go to Home
					</Button>
				</div>
			</div>
		);
	}

	if (!hasActiveSubscription) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-4 py-8">
					<div className="max-w-4xl mx-auto">
						<div className="text-center mb-8">
							<h1 className="text-3xl font-bold text-gray-900 mb-4">
								Welcome to Experience {experienceId}
							</h1>
							<p className="text-lg text-gray-600 mb-6">
								You need an active subscription to access the video editor.
							</p>
						</div>
						
						<Paywall onUpgrade={handleUpgrade} />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				{/* Header with subscription info */}
				<div className="mb-8">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 mb-2">
								Experience {experienceId}
							</h1>
							<p className="text-gray-600">
								Create professional videos from your scripts
							</p>
						</div>
						
						{subscription && (
							<div className="flex items-center gap-2">
								<Badge variant="secondary" className="flex items-center gap-1">
									{subscription.planId === 'basic' && <Zap className="w-3 h-3" />}
									{subscription.planId === 'pro' && <Crown className="w-3 h-3" />}
									{subscription.planId === 'enterprise' && <Star className="w-3 h-3" />}
									{subscription.planId?.charAt(0).toUpperCase() + subscription.planId?.slice(1)} Plan
								</Badge>
							</div>
						)}
					</div>
				</div>

				{/* Editor Component with MainLayout */}
				<div className="bg-white rounded-lg shadow-sm border h-[calc(100vh-200px)]">
					<MainLayout />
				</div>
			</div>
		</div>
	);
}
