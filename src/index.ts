import express from 'express';
import cors from 'cors';
import multer from 'multer';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import { upload as uploadToS3 } from './utils/UploadS3';
import { v4 as uuid } from 'uuid';
import { authenticator, totp } from 'otplib';
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const pool = mysql.createPool({
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	port: parseInt(process.env.DB_PORT as string),
	host: process.env.DB_HOST,
});
const db = pool.promise();

app.post('/upload', upload.single('file'), async (req, res) => {
	const file = req.file;
	const { subject, exam, examType, course, code } = req.query;
	if (!code) {
		return res.status(401).json({ message: 'No code' });
	}
	console.log(req.query);
	const isValid = authenticator.verify({
		secret: process.env.MFA_SECRET as string,
		token: code as string,
	});
	console.log(isValid, process.env.MFA_SECRET);
	if (!isValid) {
		return res.status(401).json({ message: 'Invalid code' });
	}
	if (!file) {
		return res.status(400).json({ message: 'No file uploaded' });
	}
	const url = await uploadToS3(file.path, file.originalname);
	await db.query(
		`INSERT INTO papers (id,subject, exam, exam_type, course, url) VALUES ('${uuid()}', '${subject}', '${exam}', '${examType}', '${course}', '${url}')`,
	);
	res.json({
		message: 'File uploaded successfully',
	});
});
app.get('/all', async (req, res) => {
	const [rows] = await db.query('SELECT * FROM papers');
	res.json({
		message: 'Fetch data successfully',
		data: rows,
	});
});
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT} `);
});
