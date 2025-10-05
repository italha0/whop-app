"use client";

import { useWhopAuth } from '@/hooks/useWhopAuth';

export default function HomePage() {
  const { data, isLoading } = useWhopAuth();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Welcome, {data?.username}</h1>
    </div>
  );
}