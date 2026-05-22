import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dhnkp7ryz',
  api_key: process.env.CLOUDINARY_API_KEY || '995598271277259',
  api_secret:
    process.env.CLOUDINARY_API_SECRET || 'rPuhD7P4kUKMCflsOlrY_Utq6oo',
});

export default cloudinary;
