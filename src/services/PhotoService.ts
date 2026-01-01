/**
 * Photo Service
 * Manages photo attachments for evidence documentation
 * Uses expo-image-picker and expo-file-system
 */

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { PhotoAttachment, PhotoCategory, createPhotoAttachment } from '../domain/models/PhotoAttachment';
import { ids } from '../utils/ids';

export interface PhotoPickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
}

export interface CapturedPhoto {
  uri: string;
  width?: number;
  height?: number;
  fileSize?: number;
}

export class PhotoService {
  private static readonly PHOTO_DIR = `${FileSystem.documentDirectory}photos/`;
  
  /**
   * Ensure photo directory exists
   */
  private static async ensurePhotoDirectory(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.PHOTO_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.PHOTO_DIR, { intermediates: true });
    }
  }
  
  /**
   * Request camera permissions
   */
  static async requestCameraPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }
  
  /**
   * Request media library permissions
   */
  static async requestMediaLibraryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }
  
  /**
   * Take a photo with camera
   */
  static async takePhoto(options: PhotoPickerOptions = {}): Promise<CapturedPhoto | null> {
    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) {
      throw new Error('Camera permission not granted');
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect ?? [4, 3],
      quality: options.quality ?? 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    
    if (result.canceled) {
      return null;
    }
    
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize,
    };
  }
  
  /**
   * Pick photo from library
   */
  static async pickPhoto(options: PhotoPickerOptions = {}): Promise<CapturedPhoto | null> {
    const hasPermission = await this.requestMediaLibraryPermission();
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect ?? [4, 3],
      quality: options.quality ?? 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: options.allowsMultipleSelection ?? false,
    });
    
    if (result.canceled) {
      return null;
    }
    
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize,
    };
  }
  
  /**
   * Pick multiple photos from library
   */
  static async pickMultiplePhotos(options: PhotoPickerOptions = {}): Promise<CapturedPhoto[]> {
    const hasPermission = await this.requestMediaLibraryPermission();
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: options.allowsEditing ?? false,
      quality: options.quality ?? 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
    });
    
    if (result.canceled) {
      return [];
    }
    
    return result.assets.map((asset: any) => ({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize,
    }));
  }
  
  /**
   * Save photo to app's photo directory
   */
  static async savePhoto(photo: CapturedPhoto): Promise<string> {
    await this.ensurePhotoDirectory();
    
    const filename = `photo_${Date.now()}.jpg`;
    const destinationUri = `${this.PHOTO_DIR}${filename}`;
    
    await FileSystem.copyAsync({
      from: photo.uri,
      to: destinationUri,
    });
    
    return destinationUri;
  }
  
  /**
   * Create photo attachment from captured photo
   */
  static async createAttachment(
    photo: CapturedPhoto,
    entityType: PhotoAttachment['entityType'],
    entityId: string,
    category: PhotoCategory,
    caption?: string
  ): Promise<PhotoAttachment> {
    const savedUri = await this.savePhoto(photo);
    const photoId = ids.photo();
    
    const attachment = createPhotoAttachment(
      photoId,
      entityType,
      entityId,
      savedUri,
      category
    );
    
    return {
      ...attachment,
      width: photo.width,
      height: photo.height,
      fileSize: photo.fileSize,
      caption,
    };
  }
  
  /**
   * Delete photo from file system
   */
  static async deletePhoto(uri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  }
  
  /**
   * Delete multiple photos
   */
  static async deletePhotos(uris: string[]): Promise<void> {
    await Promise.all(uris.map(uri => this.deletePhoto(uri)));
  }
  
  /**
   * Get photo file size in MB
   */
  static async getPhotoSize(uri: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && 'size' in fileInfo) {
        return fileInfo.size / (1024 * 1024); // Convert to MB
      }
      return 0;
    } catch (error) {
      console.error('Error getting photo size:', error);
      return 0;
    }
  }
  
  /**
   * Get total storage used by photos
   */
  static async getTotalStorageUsed(): Promise<number> {
    try {
      await this.ensurePhotoDirectory();
      const dirContents = await FileSystem.readDirectoryAsync(this.PHOTO_DIR);
      
      let totalSize = 0;
      for (const filename of dirContents) {
        const uri = `${this.PHOTO_DIR}${filename}`;
        const size = await this.getPhotoSize(uri);
        totalSize += size;
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating storage:', error);
      return 0;
    }
  }
  
  /**
   * Clean up orphaned photos (photos not referenced by any entity)
   */
  static async cleanupOrphanedPhotos(attachments: PhotoAttachment[]): Promise<number> {
    try {
      await this.ensurePhotoDirectory();
      const dirContents = await FileSystem.readDirectoryAsync(this.PHOTO_DIR);
      
      const referencedUris = new Set(attachments.map(a => a.uri));
      let deletedCount = 0;
      
      for (const filename of dirContents) {
        const uri = `${this.PHOTO_DIR}${filename}`;
        if (!referencedUris.has(uri)) {
          await this.deletePhoto(uri);
          deletedCount++;
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up photos:', error);
      return 0;
    }
  }
  
  /**
   * Compress photo for export/sharing
   */
  static async compressPhoto(uri: string): Promise<string> {
    // Use ImageManipulator from expo-image-manipulator if needed
    // For now, just return the original URI
    // This can be enhanced later with actual compression
    return uri;
  }
  
  /**
   * Get evidence strength summary for a set of photos
   */
  static getEvidenceSummary(attachments: PhotoAttachment[]): {
    high: number;
    medium: number;
    low: number;
    total: number;
    categories: Map<PhotoCategory, number>;
  } {
    const summary = {
      high: 0,
      medium: 0,
      low: 0,
      total: attachments.length,
      categories: new Map<PhotoCategory, number>(),
    };
    
    attachments.forEach(attachment => {
      // Count by evidence value
      const value = this.getEvidenceValue(attachment.category);
      summary[value]++;
      
      // Count by category
      const count = summary.categories.get(attachment.category) || 0;
      summary.categories.set(attachment.category, count + 1);
    });
    
    return summary;
  }
  
  /**
   * Get evidence value for a photo category
   */
  private static getEvidenceValue(category: PhotoCategory): 'high' | 'medium' | 'low' {
    const highValue: PhotoCategory[] = [
      'symptom_visible',
      'medical_device',
      'mobility_aid',
    ];
    
    const mediumValue: PhotoCategory[] = [
      'medication',
      'adaptive_equipment',
      'treatment',
    ];
    
    if (highValue.includes(category)) return 'high';
    if (mediumValue.includes(category)) return 'medium';
    return 'low';
  }
}
