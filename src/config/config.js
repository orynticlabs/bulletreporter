const config = {
  // API Configuration
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://bullet-reporter-backend.onrender.com/api',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Cloudinary Configuration (if needed)
  CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  
  // Other configurations
  APP_NAME: 'Bullet Reporter',
  VERSION: '1.0.0'
};

// Validate required environment variables
const requiredEnvVars = ['NEXT_PUBLIC_API_URL'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName] && process.env.NODE_ENV === 'production') {
    // console.warn(`Warning: ${varName} is not set in production environment`);
  }
});

export default config; 
