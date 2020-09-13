import { AWS } from '@incarnate/cloud';

module.exports = {
  handler: AWS({
    incarnateConfig: {
      subMap: {
        package: {
          subMap: {
            service: {
              factory: () => {
                return {
                  method: async arg1 => `Received: ${arg1}`,
                };
              },
            },
          },
        },
      },
    },
    allowedPaths: ['/package/service/method'],
    allowedOrigin: 'https://example.com',
  }),
};
