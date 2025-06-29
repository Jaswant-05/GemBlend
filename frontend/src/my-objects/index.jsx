import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Download, Trash2, Search, Eye, ImageIcon, AlertCircle } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import Navbar from "@/components/custom/Navbar";

export default function MyObjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(null);
  const { getToken, isSignedIn, userId } = useAuth();

  const authenticatedFetch = async (url, options = {}) => {
    const token = await getToken();
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        ...(options.body && typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  };

  // Fetch user's projects
  const fetchProjects = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await authenticatedFetch(
        `http://localhost:3001/api/projects?userId=${userId}&limit=50`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setProjects(result.projects || []);
        console.log('Fetched projects:', result.projects); // Debug log
      } else {
        setError(result.error || 'Failed to fetch projects');
      }
    } catch (error) {
      console.error('Fetch projects error:', error);
      setError('Failed to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Download .blend file
  const handleDownload = async (project) => {
    if (!project.id || !userId) {
      setError('Missing project ID or user authentication');
      return;
    }

    setDownloadLoading(project.id);
    setError(null);

    try {
      console.log(`Downloading project ${project.id} for user ${userId}`); // Debug log
      
      const response = await authenticatedFetch(
        `http://localhost:3001/api/projects/${project.id}/download/blend?userId=${userId}`,
        {
          method: 'GET',
        }
      );

      console.log('Download response status:', response.status); // Debug log

      if (response.ok) {
        const blob = await response.blob();
        console.log('Downloaded blob size:', blob.size); // Debug log
        
        if (blob.size === 0) {
          throw new Error('Downloaded file is empty');
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.prompt.slice(0, 30).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.blend`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        console.log('Download completed successfully'); // Debug log
      } else {
        const errorText = await response.text();
        let errorMessage = 'Download failed';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        console.error('Download failed:', errorMessage); // Debug log
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Download error:', error);
      setError(`Download failed: ${error.message}`);
    } finally {
      setDownloadLoading(null);
    }
  };

  // Download preview image
  const handleImageDownload = async (project) => {
    if (!project.previewImage) return;

    try {
      const response = await fetch(`http://localhost:3001${project.previewImage}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.prompt.slice(0, 30).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_preview.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Image download error:', error);
      setError('Failed to download preview image');
    }
  };

  // Delete project
  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(projectId);
    setError(null);
    
    try {
      const response = await authenticatedFetch(
        `http://localhost:3001/api/projects/${projectId}`,
        {
          method: 'DELETE',
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();

      if (result.success) {
        // Remove the deleted project from the list
        setProjects(projects.filter(project => project.id !== projectId));
      } else {
        setError(result.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete project. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.prompt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Format execution time
  const formatExecutionTime = (ms) => {
    if (!ms || ms <= 0) return 'N/A';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Refresh projects
  const handleRefresh = () => {
    fetchProjects();
  };

  useEffect(() => {
    if (isSignedIn && userId) {
      fetchProjects();
    }
  }, [isSignedIn, userId]);

  if (!isSignedIn) {
    return (
      <div>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-xl text-gray-500 mb-4">Please sign in to view your objects.</p>
            <Button onClick={() => window.location.href = '/sign-in'}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="sm:px-10 md:px-32 lg:px-56 xl:px-10 px-5 mt-10 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="font-bold text-3xl mb-2">My Objects</h2>
            <p className="text-gray-500 text-xl">
              Manage and download your generated Blender objects
            </p>
          </div>
          
          <div className="flex gap-4 mt-4 md:mt-0">
            {/* Refresh Button */}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              {loading ? (
                <AiOutlineLoading3Quarters className="animate-spin h-4 w-4" />
              ) : (
                'Refresh'
              )}
            </Button>
            
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-600 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <Button 
                onClick={() => setError(null)} 
                variant="ghost" 
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <AiOutlineLoading3Quarters className="animate-spin h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Loading your projects...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-lg border border-gray-200 p-12 max-w-md mx-auto">
              <Eye className="mx-auto h-16 w-16 text-gray-400 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {searchTerm ? 'No matching projects found' : 'No projects yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms or create a new project' 
                  : 'Create your first 3D object to get started'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => window.location.href = '/create'}
                  className="transition-all duration-300 hover:-translate-y-0.5"
                >
                  Create Your First Object
                </Button>
              )}
              {searchTerm && (
                <Button 
                  onClick={() => setSearchTerm('')}
                  variant="outline"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project) => (
                <div key={project.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* Card Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 pr-2">
                        "{project.prompt || 'Untitled Project'}"
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        project.status?.toLowerCase() === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : project.status?.toLowerCase() === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.status || 'unknown'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Created {formatDate(project.createdAt)}
                    </p>
                  </div>
                  
                  {/* Card Content */}
                  <div className="px-6 pb-6">
                    {/* PREVIEW IMAGE SECTION */}
                    <div className="mb-6">
                      {project.previewImage && project.status?.toLowerCase() === 'completed' ? (
                        <div className="relative group">
                          <img
                            src={`http://localhost:3001${project.previewImage}`}
                            alt={`Preview of ${project.prompt}`}
                            className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
                            onError={(e) => {
                              console.error('Image failed to load:', project.previewImage);
                              e.target.parentElement.innerHTML = `
                                <div class="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                  <div class="text-center text-gray-500">
                                    <svg class="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <p class="text-sm">Preview unavailable</p>
                                  </div>
                                </div>
                              `;
                            }}
                          />
                          {/* Image download overlay */}
                          <div 
                            className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                            onClick={() => handleImageDownload(project)}
                          >
                            <Download className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      ) : project.status?.toLowerCase() === 'completed' ? (
                        <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <ImageIcon className="mx-auto h-8 w-8 mb-2" />
                            <p className="text-sm">No preview available</p>
                          </div>
                        </div>
                      ) : project.status?.toLowerCase() === 'failed' ? (
                        <div className="w-full h-48 bg-red-50 rounded-lg border border-red-200 flex items-center justify-center">
                          <div className="text-center text-red-500">
                            <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                            <p className="text-sm">Generation failed</p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-yellow-50 rounded-lg border border-yellow-200 flex items-center justify-center">
                          <div className="text-center text-yellow-600">
                            <AiOutlineLoading3Quarters className="animate-spin mx-auto h-8 w-8 mb-2" />
                            <p className="text-sm">Generating...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Project Details */}
                    <div className="space-y-3 mb-6">
                      {project.executionTime && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Generation time:</span>
                          <span className="font-medium text-gray-900">{formatExecutionTime(project.executionTime)}</span>
                        </div>
                      )}
                      {project.errorMessage && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-600 text-xs font-medium mb-1">Error Details:</p>
                          <p className="text-red-600 text-xs">{project.errorMessage}</p>
                        </div>
                      )}
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-3">
                      {project.status?.toLowerCase() === 'completed' && project.blendFile && (
                        <Button
                          onClick={() => handleDownload(project)}
                          disabled={downloadLoading === project.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {downloadLoading === project.id ? (
                            <>
                              <AiOutlineLoading3Quarters className="animate-spin h-4 w-4" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Download .blend
                            </>
                          )}
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => handleDelete(project.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        disabled={deleteLoading === project.id}
                      >
                        {deleteLoading === project.id ? (
                          <AiOutlineLoading3Quarters className="animate-spin h-4 w-4" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Results Summary */}
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 text-gray-600">
                <Eye className="h-4 w-4" />
                <span>Showing {filteredProjects.length} of {projects.length} projects</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}