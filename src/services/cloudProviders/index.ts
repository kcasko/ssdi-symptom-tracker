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
        // TODO: Implement S3 and Google Drive providers
        console.warn(`${config.provider} not implemented, using local storage`);
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
