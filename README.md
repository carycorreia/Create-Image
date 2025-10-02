# AI Image Studio

A modern, full-stack AI image generation application built with Next.js, Firebase, and Replicate API.

## Features

- 🎨 **AI Image Generation** - Generate stunning images using Flux and Ideogram models
- 🔐 **Google Authentication** - Secure user authentication with Firebase Auth
- 💾 **Image Storage** - Personal gallery with Firebase Firestore
- 🎯 **Model Selection** - Choose between different AI models
- 📱 **Responsive Design** - Beautiful glass-morphism UI that works on all devices
- ⚡ **Real-time Updates** - Images appear instantly in your gallery

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Authentication**: Firebase Auth (Google Sign-In)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **AI Models**: Replicate API (Flux Dev, Ideogram V2)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project
- Replicate API account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/carycorreia/Create-Image.git
cd Create-Image
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:
```env
# Replicate API Token
REPLICATE_API_TOKEN=your_replicate_token

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Manual Deployment

```bash
npm run build
npm start
```

## Usage

1. **Sign In** - Use Google authentication to access the app
2. **Choose Model** - Select between Flux Dev or Ideogram V2
3. **Generate Images** - Enter a prompt and create amazing images
4. **View Gallery** - See all your generated images in "My Images" tab
5. **Download** - Save your favorite creations

## API Endpoints

- `POST /api/generateImage` - Generate images using AI models
- `GET /api/userImages` - Fetch user's image gallery
- `GET /api/testFirestore` - Test Firestore connection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email carymcorreia@gmail.com or create an issue on GitHub.