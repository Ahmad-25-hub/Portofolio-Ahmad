import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectView from "@/components/work/ProjectView";
import { getProject, projects } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

// Every slug is prerendered, and the page-transition curtain covers navigation,
// so waiting for the full page (instead of streaming a shell) is intentional.
export const instant = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: `${project.tagline} ${project.overview}`,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const index = projects.findIndex((p) => p.slug === slug);
  if (index === -1) notFound();
  const next = projects[(index + 1) % projects.length];
  return <ProjectView project={projects[index]} index={index} total={projects.length} next={next} />;
}
