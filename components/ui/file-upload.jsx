"use client";

import { useState, useRef } from "react";
import { Upload, X, File, Image, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FileUpload({ 
  label, 
  required = false, 
  accept = "*", // Allow all file types
  maxSizeMB = 5,
  value,
  onChange,
  error,
  documentType
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(value ? URL.createObjectURL(value) : null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    // Validate file size only
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // No file type validation - accept all types
    onChange(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (value) {
      if (value.type.startsWith('image/')) {
        return <Image className="w-8 h-8 text-blue-500" />;
      }
      return <File className="w-8 h-8 text-blue-500" />;
    }
    return <Upload className="w-8 h-8 text-gray-400" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {!value ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-smooth
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : error 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
            }
          `}
        >
          <div className="flex flex-col items-center gap-3">
            {getFileIcon()}
            <div>
              <p className="text-sm font-medium text-gray-700">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                All file types accepted • Max size: {maxSizeMB}MB
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {preview ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-green-300">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center border-2 border-green-300">
                  <File className="w-8 h-8 text-green-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {value.name}
                  </p>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {formatFileSize(value.size)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

