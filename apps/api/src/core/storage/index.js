import { config } from '../../config/env.js';
import { LocalAdapter } from './LocalAdapter.js';
// import { S3Adapter } from './S3Adapter.js'; // Future

let storage;

if (config.storageDriver === 's3') {
    // storage = new S3Adapter(config.s3);
    throw new Error("S3 Adapter not implemented");
} else {
    storage = new LocalAdapter();
}

export { storage };