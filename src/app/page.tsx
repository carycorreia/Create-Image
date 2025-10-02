'use client';

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "../lib/hooks/useAuth";
import SignInPage from "../components/SignInPage";
import { getUserImages } from "../lib/firebase/imageStorage";

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('flux-dev');
  const [activeTab, setActiveTab] = useState<'generate' | 'my-images'>('generate');
  const [userImages, setUserImages] = useState<any[]>([]);
  const [deletingImages, setDeletingImages] = useState(false);

  const fetchUserImages = useCallback(async () => {
    if (!user) return;
    try {
      console.log('Fetching images for user:', user.uid);
      const images = await getUserImages(user.uid);
      console.log('Received images:', images);
      
      // Debug each image to check URL
      images.forEach((img, index) => {
        console.log(`Image ${index}:`, {
          url: img.url,
          prompt: img.prompt,
          model: img.model,
          hasUrl: !!img.url,
          urlType: typeof img.url
        });
      });
      
      setUserImages(images);
    } catch (error) {
      console.error('Error fetching user images:', error);
    }
  }, [user]);

  // Fetch user images when user is authenticated
  useEffect(() => {
    if (user) {
      fetchUserImages();
    }
  }, [user, fetchUserImages]);

  const deleteAllImages = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete ALL your images? This action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    setDeletingImages(true);
    try {
      const response = await fetch('/api/deleteAllImages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`Deleted ${result.deletedCount} images`);
        // Refresh the images list
        await fetchUserImages();
        alert(`Successfully deleted ${result.deletedCount} images!`);
      } else {
        console.error('Failed to delete images:', result.error);
        alert('Failed to delete images. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting images:', error);
      alert('Error deleting images. Please try again.');
    } finally {
      setDeletingImages(false);
    }
  };

  const models = {
    'flux-dev': {
      name: 'Flux Dev',
      description: 'High-quality, fast generation',
      model: 'black-forest-labs/flux-dev'
    },
    'ideogram-v2': {
      name: 'Ideogram V2',
      description: 'Excellent text rendering in images',
      model: 'ideogram-ai/ideogram-v2a'
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    setImage(null);

    try {
      const res = await fetch('/api/generateImage', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: selectedModel, userId: user?.uid }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }
      
      setImage(data.output);
      
      console.log('Image generation response:', data);
      
      // Refresh user images after successful generation
      if (data.savedImage) {
        console.log('Image was saved, refreshing gallery');
        fetchUserImages();
      } else {
        console.log('No saved image data, but refreshing gallery anyway');
        fetchUserImages();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </main>
    );
  }

  // Show sign-in page if user is not authenticated
  if (!user) {
    return <SignInPage />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* User Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-white font-semibold">
                {user.displayName || 'User'}
              </h2>
              <p className="text-white/60 text-sm">{user.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl transition-all duration-200"
          >
            Sign Out
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('generate')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === 'generate'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Generate Images
              </button>
              <button
                onClick={() => {
                  setActiveTab('my-images');
                  fetchUserImages(); // Refresh images when switching to this tab
                }}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === 'my-images'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                My Images
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {activeTab === 'generate' && (
          <>
            {/* Header */}
            <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mb-6 shadow-2xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-6xl font-black bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-6 tracking-tight">
            AI Image Studio
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Transform your imagination into stunning visuals with cutting-edge AI models. 
            Choose your style and watch creativity come to life.
          </p>
        </div>

        {/* Input Form */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 mb-8">
          {/* Model Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-white/90 mb-4 uppercase tracking-wider">
              Choose AI Model
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(models).map(([key, model]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedModel(key)}
                  className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    selectedModel === key
                      ? 'border-purple-400 bg-gradient-to-br from-purple-500/20 to-blue-500/20 shadow-lg shadow-purple-500/25'
                      : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                  }`}
                >
                  <div className="text-left">
                    <div className="flex items-center mb-2">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        selectedModel === key ? 'bg-purple-400' : 'bg-white/40'
                      }`}></div>
                      <div className="font-bold text-white text-lg">{model.name}</div>
                    </div>
                    <div className="text-sm text-white/70 ml-6">{model.description}</div>
                  </div>
                  {selectedModel === key && (
                    <div className="absolute top-4 right-4">
                      <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="prompt" className="block text-sm font-semibold text-white/90 mb-4 uppercase tracking-wider">
                Describe your vision
              </label>
              <div className="relative">
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A majestic dragon flying over a crystal castle at sunset, digital art style..."
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none backdrop-blur-sm transition-all duration-300"
                  rows={4}
                  disabled={loading}
                />
                <div className="absolute bottom-4 right-4 text-xs text-white/40">
                  {prompt.length}/500
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="group relative w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-4 px-8 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                    <span className="text-lg">Creating Magic...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-lg">Generate Image</span>
                  </>
                )}
              </div>
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="backdrop-blur-xl bg-red-500/10 border border-red-400/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Generated Image */}
        {image && (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                ✨ Your Creation
              </h2>
              <p className="text-white/70">Generated with {models[selectedModel as keyof typeof models].name}</p>
            </div>
            <div className="flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <Image
                    src={image}
                    alt="Generated image"
                    width={512}
                    height={512}
                    className="rounded-2xl shadow-2xl transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute top-4 right-4">
                    <a
                      href={image}
                      download
                      className="bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Model Information */}
            <div className="mt-8 flex justify-center">
              <div className="relative group">
                <div className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-4 cursor-help transition-all duration-300 backdrop-blur-sm">
                  <svg 
                    className="w-6 h-6 text-white/80" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-96 backdrop-blur-xl bg-slate-900/95 border border-white/20 text-white text-sm rounded-2xl p-6 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 shadow-2xl">
                  <div className="space-y-3">
                    <div className="font-bold text-purple-300 text-base">Model Information</div>
                    <div><span className="text-white/70">Model:</span> <span className="text-white font-mono">{models[selectedModel as keyof typeof models].model}</span></div>
                    <div><span className="text-white/70">Provider:</span> <span className="text-white">Replicate</span></div>
                        <div><span className="text-white/70">Prompt:</span> <span className="text-white italic">&ldquo;{prompt}&rdquo;</span></div>
                    <div className="pt-3 border-t border-white/20">
                      <div className="font-bold text-blue-300 text-base mb-2">Parameters</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-white/70">Width:</span> <span className="text-white">512px</span></div>
                        <div><span className="text-white/70">Height:</span> <span className="text-white">512px</span></div>
                        <div><span className="text-white/70">Format:</span> <span className="text-white">PNG</span></div>
                        <div><span className="text-white/70">Quality:</span> <span className="text-white">High</span></div>
                      </div>
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900/95"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-16 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">💡 Pro Tips</h3>
            <p className="text-white/70">Get the most out of your AI image generation</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-white/80">Be specific about style, lighting, and composition</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-white/80">Include artistic styles like "digital art", "photorealistic", or "oil painting"</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-white/80">Mention colors, mood, and atmosphere</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-white/80">Try different perspectives like "close-up", "wide shot", or "bird's eye view"</p>
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {/* My Images Tab */}
        {activeTab === 'my-images' && (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                🖼️ My Images
              </h2>
              <p className="text-white/70">Your AI-generated image collection</p>
              {userImages.length > 0 && (
                <button
                  onClick={deleteAllImages}
                  disabled={deletingImages}
                  className="mt-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingImages ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-300 inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    '🗑️ Delete All Images'
                  )}
                </button>
              )}
            </div>
            
            {userImages.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-white/40 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-white/60 text-lg">No images yet</p>
                <p className="text-white/40 text-sm mt-2">Generate your first image to see it here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userImages.map((imageData, index) => (
                  <div key={index} className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative">
                      {imageData.url ? (
                        <Image
                          src={imageData.url}
                          alt={imageData.prompt}
                          width={300}
                          height={300}
                          className="rounded-2xl shadow-2xl transition-transform duration-300 group-hover:scale-105 w-full h-64 object-cover"
                          unoptimized
                          onError={(e) => {
                            console.error('Image failed to load:', imageData.url);
                            console.error('Image data:', imageData);
                          }}
                        />
                      ) : (
                        <div className="w-full h-64 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                          <div className="text-center p-4">
                            <svg className="w-12 h-12 text-white/60 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-white/80 text-sm font-medium">Image not available</p>
                            <p className="text-white/60 text-xs mt-1 break-words">{imageData.prompt}</p>
                          </div>
                        </div>
                      )}
                      {imageData.url && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
                          <a
                            href={imageData.url}
                            download
                            className="bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 space-y-2">
                      <p className="text-white/80 text-sm truncate" title={imageData.prompt}>
                        {imageData.prompt}
                      </p>
                      
                      {/* Model Information */}
                      <div className="bg-white/5 rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Model:</span>
                          <span className="text-white/90 text-xs font-mono">{imageData.model}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Provider:</span>
                          <span className="text-white/90 text-xs">Replicate</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Size:</span>
                          <span className="text-white/90 text-xs">512x512px</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Format:</span>
                          <span className="text-white/90 text-xs">PNG</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Created:</span>
                          <span className="text-white/90 text-xs">
                            {new Date(imageData.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
