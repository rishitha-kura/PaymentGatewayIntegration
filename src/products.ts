import { Product } from "./types";

export const PRODUCTS: Product[] = [
  {
    id: "prod_frontend",
    name: "Frontend Mastery Blueprint",
    description: "The complete guide to master modern React, TypeScript, and high-performance Tailwind CSS styling. Includes lifetime updates.",
    price: 499,
    category: "Development",
    imageColor: "from-blue-500 to-indigo-600",
    features: [
      "50+ Interactive code playgrounds",
      "Advanced state management guide",
      "Tailwind optimization cheatsheet",
      "Private Discord community access"
    ]
  },
  {
    id: "prod_saas",
    name: "Full-Stack SaaS Boilerplate",
    description: "Save 100+ hours of setup. Pre-configured with Next.js, Auth, Prisma, Cloud Database, and beautiful ready-to-use landing pages.",
    price: 1299,
    category: "Templates",
    imageColor: "from-purple-500 to-pink-600",
    features: [
      "Ready-to-use Express & Next.js starter",
      "Pre-integrated Authentication",
      "PostgreSQL & Prisma Schema setup",
      "Stripe and Razorpay billing routes"
    ]
  },
  {
    id: "prod_ai",
    name: "AI Integration Masterclass",
    description: "Step-by-step masterclass on integrating Gemini AI and LLM agents into your application server. Build chatbot proxies & search tools.",
    price: 799,
    category: "Artificial Intelligence",
    imageColor: "from-emerald-500 to-teal-600",
    features: [
      "12 Practical model calling patterns",
      "Advanced prompt tuning tutorials",
      "Server-side proxy security guides",
      "Fully functional code templates"
    ]
  },
  {
    id: "prod_cloud",
    name: "Cloud Deployment Playbook",
    description: "Step-by-step developer guide to containerization, Dockerfiles, and deploying full-stack Node.js servers to AWS and Cloud Run.",
    price: 299,
    category: "DevOps",
    imageColor: "from-orange-500 to-red-600",
    features: [
      "Docker & Kubernetes configurations",
      "CI/CD Github Action pipelines",
      "SSL, Domains & DNS guide",
      "Cost-saving deployment tips"
    ]
  }
];
