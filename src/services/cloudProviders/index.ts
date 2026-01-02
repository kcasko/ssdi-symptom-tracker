/**
 * Cloud Provider Factory
 * 
 * Routes backup operations to the configured cloud provider.
 */

import { BackupConfig } from '../../domain/models/BackupModels';
import { ICloudProvider } from './ICloudProvider';
import { LocalProvider } from './LocalProvider';

export interface CloudProvider {
  isAvailable(): Promise<boolean>;
  upload(backup: any): Promise<string>;
  download(backupId: string): Promise<any>;
  list(): Promise<any[]>;
  delete(backupId: string): Promise<void>;
  getStorageInfo(): Promise<{
    totalSpace?: number;
    usedSpace?: number;
    availableSpace?: number;
  }>;
}

export class CloudProviderFactory {
  /**
   * Get provider instance for configuration
   */
  static getProvider(config: BackupConfig): CloudProvider {
    switch (config.provider) {
      case 'icloud':
        return ICloudProvider as any;
      
      case 'local':
        return LocalProvider as any;
      
      case 's3':
      case 'gdrive':
        // Cloud providers not yet implemented - graceful fallback to local
        console.info(`[CloudProvider] ${config.provider} provider not implemented yet, falling back to local storage`);
        console.info(`[CloudProvider] To implement ${config.provider}:`);
        if (config.provider === 's3') {
          console.info('  - Install aws-sdk or @aws-sdk/client-s3');
          console.info('  - Create S3Provider class implementing CloudBackupProvider');
          console.info('  - Add AWS credentials configuration');
        } else {
          console.info('  - Install googleapis package');
          console.info('  - Create GoogleDriveProvider class implementing CloudBackupProvider');
          console.info('  - Add Google Drive API credentials configuration');
        }
        return LocalProvider as any;
      
      default:
        return LocalProvider as any;
    }
  }
  
  /**
   * Check if provider is available
   */
  static async isProviderAvailable(provider: BackupConfig['provider']): Promise<boolean> {
    const providerInstance = this.getProvider({ provider } as BackupConfig);
    return providerInstance.isAvailable();
  }
}
