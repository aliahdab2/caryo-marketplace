import { Metadata } from "next";

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `Edit Listing #${params.id}`,
    description: "Edit your vehicle listing details"
  };
}
