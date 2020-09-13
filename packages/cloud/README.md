# Incarnate Cloud

![Cloud CI](https://github.com/resistdesign/incarnate-complete/workflows/Cloud%20CI/badge.svg)

Cloud Function Middleware for [Incarnate](http://incarnate.resist.design)

## Install

`npm i -S @incarnate/cloud`

## API Docs

http://cloud.incarnate.resist.design

## Usage

```ts
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

```
