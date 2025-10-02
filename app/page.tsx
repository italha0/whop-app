'use client';

import { WhopCheckout } from '@/components/payment/WhopCheckout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Zap, Crown, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Page() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
			{/* Hero Section */}
			<div className="container mx-auto px-4 py-16">
				<div className="text-center mb-16">
					<div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
						<Video className="w-4 h-4" />
						Script-to-Video Platform
					</div>
					
					<h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
						Transform Scripts into
						<span className="text-blue-600"> Stunning Videos</span>
					</h1>
					
					<p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
						Create professional video content from your scripts in minutes. 
						Perfect for content creators, marketers, and businesses.
					</p>
					
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button size="lg" className="text-lg px-8 py-3">
							Start Creating Videos
							<ArrowRight className="ml-2 w-5 h-5" />
						</Button>
						<Button variant="outline" size="lg" className="text-lg px-8 py-3">
							Watch Demo
						</Button>
					</div>
				</div>

				{/* Features Section */}
				<div className="grid md:grid-cols-3 gap-8 mb-16">
					<Card className="text-center">
						<CardHeader>
							<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
								<Zap className="h-6 w-6 text-blue-600" />
							</div>
							<CardTitle>Lightning Fast</CardTitle>
						</CardHeader>
						<CardContent>
							<CardDescription>
								Generate professional videos in minutes, not hours. Our AI-powered platform makes video creation effortless.
							</CardDescription>
						</CardContent>
					</Card>

					<Card className="text-center">
						<CardHeader>
							<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
								<Crown className="h-6 w-6 text-green-600" />
							</div>
							<CardTitle>Professional Quality</CardTitle>
						</CardHeader>
						<CardContent>
							<CardDescription>
								High-quality 4K output with professional templates, animations, and effects that make your content stand out.
							</CardDescription>
						</CardContent>
					</Card>

					<Card className="text-center">
						<CardHeader>
							<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
								<Star className="h-6 w-6 text-purple-600" />
							</div>
							<CardTitle>Easy to Use</CardTitle>
						</CardHeader>
						<CardContent>
							<CardDescription>
								No technical skills required. Simply paste your script, choose a template, and let our platform do the rest.
							</CardDescription>
						</CardContent>
					</Card>
				</div>

				{/* Pricing Section */}
				<div id="pricing" className="mb-16">
					<div className="text-center mb-12">
						<h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
						<p className="text-lg text-gray-600">
							Choose the plan that fits your needs. All plans include a 7-day free trial.
						</p>
					</div>
					<WhopCheckout />
				</div>

				{/* CTA Section */}
				<div className="text-center bg-white rounded-2xl p-12 shadow-lg">
					<h2 className="text-3xl font-bold text-gray-900 mb-4">
						Ready to Create Amazing Videos?
					</h2>
					<p className="text-lg text-gray-600 mb-8">
						Join thousands of creators who are already using our platform to create stunning video content.
					</p>
					<Button size="lg" className="text-lg px-8 py-3">
						Get Started Free
						<ArrowRight className="ml-2 w-5 h-5" />
					</Button>
				</div>
			</div>
		</div>
	);
}
