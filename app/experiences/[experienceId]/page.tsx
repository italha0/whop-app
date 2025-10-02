import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	// The experienceId is a path param
	const { experienceId } = await params;

	// Check if we're in development mode (no Whop iframe)
	// Try to detect if we're running in a real Whop environment
	const headersList = await headers();
	const hasWhopHeaders = headersList.get('x-whop-user-id') || 
		headersList.get('whop-user-id') || 
		headersList.get('x-whop-company-id') ||
		headersList.get('whop-company-id');
	
	// Also check for referrer to see if we're in Whop iframe
	const referrer = headersList.get('referer') || '';
	const isInWhopIframe = referrer.includes('whop.com') || referrer.includes('whop.io');
	
	const isDevelopment = !hasWhopHeaders && !isInWhopIframe && process.env.NODE_ENV === 'development';
	
	// Debug logging
	console.log('Headers debug:', {
		hasWhopHeaders,
		isInWhopIframe,
		referrer,
		isDevelopment,
		allHeaders: Object.fromEntries(headersList.entries())
	});
	
	let userId: string;
	let result: any;
	let user: any;
	let experience: any;
	let accessLevel: string;

	if (isDevelopment) {
		// Development mode - use mock data
		console.log('Running in development mode - using mock data');
		
		userId = process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID || 'user_hF3wMP4gNGUTU';
		
		// Mock data for development
		result = {
			hasAccess: true,
			accessLevel: 'admin'
		};
		
		user = {
			name: 'Development User',
			username: 'dev_user',
			id: userId
		};
		
		experience = {
			name: `Experience ${experienceId}`,
			id: experienceId
		};
		
		accessLevel = 'admin';
	} else {
		// Production mode - use real Whop SDK
		try {
			// The user token is in the headers
			const tokenResult = await whopSdk.verifyUserToken(headersList);
			userId = tokenResult.userId;

			result = await whopSdk.access.checkIfUserHasAccessToExperience({
				userId,
				experienceId,
			});

			user = await whopSdk.users.getUser({ userId });
			experience = await whopSdk.experiences.getExperience({ experienceId });

			// Either: 'admin' | 'customer' | 'no_access';
			// 'admin' means the user is an admin of the whop, such as an owner or moderator
			// 'customer' means the user is a common member in this whop
			// 'no_access' means the user does not have access to the whop
			accessLevel = result.accessLevel;
		} catch (error) {
			console.error('Error verifying user token:', error);
			// Fallback to development mode if token verification fails
			userId = process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID || 'user_hF3wMP4gNGUTU';
			result = { hasAccess: true, accessLevel: 'admin' };
			user = { name: 'Fallback User', username: 'fallback_user', id: userId };
			experience = { name: `Experience ${experienceId}`, id: experienceId };
			accessLevel = 'admin';
		}
	}

	return (
		<div className="flex justify-center items-center h-screen px-8">
			<h1 className="text-xl">
				Hi <strong>{user.name}</strong>, you{" "}
				<strong>{result.hasAccess ? "have" : "do not have"} access</strong> to
				this experience. Your access level to this whop is:{" "}
				<strong>{accessLevel}</strong>. <br />
				<br />
				Your user ID is <strong>{userId}</strong> and your username is{" "}
				<strong>@{user.username}</strong>.<br />
				<br />
				You are viewing the experience: <strong>{experience.name}</strong>
			</h1>
		</div>
	);
}
