import { type Metadata } from "next";
import PricingComponent from "./pricing-component";

export const metadata: Metadata = {
  title: "Pricing Plans | Script to Video",
  description: "Find the perfect plan for your video creation needs. Start for free or upgrade to our Pro plan for HD exports, no watermarks, and premium features.",
};

export default function PricingPage() {
  return <PricingComponent />;
}