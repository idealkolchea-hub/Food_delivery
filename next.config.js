/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    VAULT_PATH: process.env.VAULT_PATH || '/home/netwin/Desktop/demo 2',
  },
};

module.exports = nextConfig;
