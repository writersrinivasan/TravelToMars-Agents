/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep LangChain / LangGraph out of the bundler so their dynamic
    // requires resolve correctly on the Node.js server runtime.
    serverComponentsExternalPackages: [
      "@langchain/langgraph",
      "@langchain/core",
      "@langchain/groq",
      "@langchain/textsplitters",
      "langchain",
    ],
  },
};

export default nextConfig;
