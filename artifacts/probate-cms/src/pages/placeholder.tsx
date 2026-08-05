import { Layout } from "@/components/layout";
import { Link } from "wouter";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <Layout>
      <div className="p-8 text-center text-muted-foreground">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p>This page is currently under construction.</p>
        <Link href="/" className="text-primary hover:underline mt-4 inline-block">Return Home</Link>
      </div>
    </Layout>
  );
}
