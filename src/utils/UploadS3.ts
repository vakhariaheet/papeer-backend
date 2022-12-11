import S3 from 'aws-sdk/clients/s3';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
const s3 = new S3({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: process.env.AWS_REGION,
});
/**
 *
 * @param path Multer file path
 * @param destPath Destination path in S3
 * @returns {Promise<string>} S3 file URL
 */
export const upload = async (
	path: string,
	destPath: string,
): Promise<string> => {
	const file = fs.createReadStream(path);
	const result = await s3
		.upload({
			Bucket: process.env.AWS_BUCKET as string,
			Key: destPath,
			Body: file,
		})
		.promise();
	return result.Location;
};
