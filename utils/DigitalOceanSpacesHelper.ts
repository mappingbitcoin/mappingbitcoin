import { S3Client, PutObjectCommand, GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import fs from 'fs/promises';

const hasSpacesConfig = Boolean(
    process.env.DO_SPACES_ENDPOINT &&
    process.env.DO_SPACES_BUCKET_NAME &&
    process.env.DO_SPACES_SECRET &&
    process.env.DO_SPACES_KEY &&
    process.env.DO_SPACES_REGION
);

if (!hasSpacesConfig) {
    console.warn('DigitalOcean Spaces env variables not set; Spaces operations will be skipped.');
}

const bucketName = process.env.DO_SPACES_BUCKET_NAME || '';
let space: S3Client | null = null;

if (hasSpacesConfig) {
    space = new S3Client({
        endpoint: process.env.DO_SPACES_ENDPOINT,
        credentials: {
            accessKeyId: process.env.DO_SPACES_KEY || '',
            secretAccessKey: process.env.DO_SPACES_SECRET || ''
        },
        region: process.env.DO_SPACES_REGION
    });
}

const FOLDER = 'mapping-bitcoin-no-delete';

// Upload a file to DigitalOcean Spaces
export async function uploadToSpaces(localFilePath: string, remoteKey: string): Promise<void> {
    if (!space) {
        console.warn('Skipping upload; DigitalOcean Spaces not configured.');
        return;
    }

    const fileData = await fs.readFile(`${localFilePath}`);

    await space.send(
        new PutObjectCommand({
            Bucket: bucketName,
            Key: `${FOLDER}/${remoteKey}`,
            Body: fileData,
            ACL: 'private'
        })
    );
    console.log(`Uploaded ${remoteKey} to Spaces.`);
}

// Download a file from DigitalOcean Spaces and save it locally
export async function downloadFromSpaces(remoteKey: string, localFilePath: string): Promise<void> {
    if (!space) {
        console.warn('Skipping download; DigitalOcean Spaces not configured.');
        return;
    }

    const result = await space.send(
        new GetObjectCommand({
            Bucket: bucketName,
            Key: `${FOLDER}/${remoteKey}`
        })
    );

    const buffer = await toBuffer(result.Body);

    await fs.writeFile(localFilePath, buffer);
    console.log(`✅ Downloaded ${remoteKey} to ${localFilePath}.`);
}

async function toBuffer(body: GetObjectCommandOutput['Body']): Promise<Buffer> {
    if (!body) {
        throw new Error('Received empty body from Spaces.');
    }

    if (Buffer.isBuffer(body)) {
        return body;
    }

    if (body instanceof Readable) {
        return streamToBuffer(body);
    }

    if (body instanceof Uint8Array) {
        return Buffer.from(body);
    }

    if (typeof body === 'string') {
        return Buffer.from(body);
    }

    if (typeof (body as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === 'function') {
        const arrayBuffer = await (body as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    throw new Error('Unsupported Body type received from Spaces.');
}

// Convert Readable stream to Buffer
function streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}
