import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Si vas a desplegar en una subruta (ej: usuario.github.io/nombre-repo/) 
  // deberás añadir 'basePath' aquí. Por ahora lo dejamos para la raíz.
};

export default nextConfig;
