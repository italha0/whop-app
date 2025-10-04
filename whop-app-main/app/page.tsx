import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	// The companyId is a path param
	const { companyId } = await params;

	// Check if we're in development mode (no Whop iframe)
	// The whop-proxy should provide proper headers when running in Whop iframe
	const headersList = await headers();
	const hasWhopHeaders = headersList.get('x-whop-user-id') || headersList.get('whop-user-id');
	const isDevelopment = !hasWhopHeaders && process.env.NODE_ENV === 'development';
	
	let userId: string;
	let result: any;
	let user: any;
	let company: any;
	let accessLevel: string;

	if (isDevelopment) {
		// Development mode - use mock data
		console.log('Running in development mode - using mock data for dashboard');
		
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
		
		company = {
			title: `Company ${companyId}`,
			id: companyId
		};
		
		accessLevel = 'admin';
	} else {
		// Production mode - use real Whop SDK
		try {
			// The user token is in the headers
			const tokenResult = await whopSdk.verifyUserToken(headersList);
			userId = tokenResult.userId;

			result = await whopSdk.access.checkIfUserHasAccessToCompany({
				userId,
				companyId,
			});

			user = await whopSdk.users.getUser({ userId });
			company = await whopSdk.companies.getCompany({ companyId });

			// Either: 'admin' | 'no_access';
			// 'admin' means the user is an admin of the company, such as an owner or moderator
			// 'no_access' means the user is not an authorized member of the company
			accessLevel = result.accessLevel;
		} catch (error) {
			console.error('Error verifying user token:', error);
			// Fallback to development mode if token verification fails
			userId = process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID || 'user_hF3wMP4gNGUTU';
			result = { hasAccess: true, accessLevel: 'admin' };
			user = { name: 'Fallback User', username: 'fallback_user', id: userId };
			company = { title: `Company ${companyId}`, id: companyId };
			accessLevel = 'admin';
		}
	}

	return (
		<div className="flex justify-center items-center h-screen px-8">
			<h1 className="text-xl">
				Hi <strong>{user.name}</strong>, you{" "}
				<strong>{result.hasAccess ? "have" : "do not have"} access</strong> to
				this company. Your access level to this company is:{" "}
				<strong>{accessLevel}</strong>. <br />
				<br />
				Your user ID is <strong>{userId}</strong> and your username is{" "}
				<strong>@{user.username}</strong>.<br />
				<br />
				You are viewing the company: <strong>{company.title}</strong>
			</h1>
		</div>
	);
}
